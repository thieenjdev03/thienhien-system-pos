/**
 * Snapshot sync API (manual, destructive).
 *
 * - GET  /api/sync  -> Pull server snapshot (BackupPayload v2)
 * - POST /api/sync  -> Push snapshot and REPLACE ALL server data
 *
 * Security: requires `SYNC_TOKEN` and header `x-sync-token`.
 */

import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { BackupPayloadSchema } from '@/domain/schemas'

const APP_NAME = 'POS-MVP' as const
const MAX_PUSH_BYTES = 25 * 1024 * 1024 // 25MB hard limit for push

function getSyncTokenError(request: NextRequest): NextResponse | null {
  const expected = process.env.SYNC_TOKEN
  if (!expected || expected.trim().length === 0) {
    return NextResponse.json(
      { error: 'SYNC_TOKEN is not configured on the server' },
      { status: 500 }
    )
  }

  const provided = request.headers.get('x-sync-token')
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}

function contentLengthTooLarge(request: NextRequest): boolean {
  const raw = request.headers.get('content-length')
  if (!raw) return false
  const len = Number(raw)
  if (!Number.isFinite(len)) return false
  return len > MAX_PUSH_BYTES
}

function toDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(String(value))
}

function toDecimalOrNull(value: number | null | undefined): Prisma.Decimal | null {
  if (value === null || value === undefined) return null
  return toDecimal(value)
}

export async function POST(request: NextRequest) {
  const authError = getSyncTokenError(request)
  if (authError) return authError

  if (contentLengthTooLarge(request)) {
    return NextResponse.json(
      { error: `Payload too large. Max is ${MAX_PUSH_BYTES} bytes.` },
      { status: 413 }
    )
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  let payload: ReturnType<typeof BackupPayloadSchema.parse>
  try {
    payload = BackupPayloadSchema.parse(rawBody)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid payload'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  // For safety: ReplaceAll + include_users requires v2 payloads.
  if (payload.meta.version !== 2) {
    return NextResponse.json(
      { error: 'Sync push requires BackupPayload meta.version = 2' },
      { status: 400 }
    )
  }

  // Build lookup sets for referential integrity & cleaning
  const validCustomerIds = new Set(payload.data.customers.map((c) => c.id))
  const validProductIds = new Set(payload.data.products.map((p) => p.id))
  const validInvoiceIds = new Set(payload.data.invoices.map((inv) => inv.id))

  // Drop orphan invoice items that reference missing product or invoice
  const filteredInvoiceItems = payload.data.invoiceItems.filter(
    (it) => validProductIds.has(it.productId) && validInvoiceIds.has(it.invoiceId)
  )

  const counts = {
    users: payload.data.users.length,
    products: payload.data.products.length,
    customers: payload.data.customers.length,
    invoices: payload.data.invoices.length,
    invoiceItems: filteredInvoiceItems.length,
    counters: payload.data.counters.length,
  }

  const startedAt = Date.now()

  try {
    await prisma.$transaction(async (tx) => {
      // Delete in FK-safe order
      await tx.invoiceItem.deleteMany()
      await tx.invoice.deleteMany()
      await tx.product.deleteMany()
      await tx.customer.deleteMany()
      await tx.counter.deleteMany()
      await tx.user.deleteMany()

      // Insert in dependency-safe order
      if (payload.data.users.length > 0) {
        await tx.user.createMany({
          data: payload.data.users.map((u) => ({
            id: u.id,
            pinHash: u.pinHash,
            displayName: u.displayName,
            role: u.role,
            active: u.active,
            createdAt: new Date(u.createdAt),
            updatedAt: new Date(u.updatedAt),
          })),
        })
      }

      if (payload.data.customers.length > 0) {
        await tx.customer.createMany({
          data: payload.data.customers.map((c) => ({
            id: c.id,
            name: c.name,
            phone: c.phone ?? null,
            address: c.address ?? null,
            note: c.note ?? null,
            debt: toDecimal(c.debt),
            createdAt: new Date(c.createdAt),
            updatedAt: new Date(c.updatedAt),
          })),
        })
      }

      if (payload.data.products.length > 0) {
        await tx.product.createMany({
          data: payload.data.products.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category ?? null,
            unit: p.unit,
            price1: toDecimalOrNull(p.price1),
            price2: toDecimalOrNull(p.price2),
            price3: toDecimalOrNull(p.price3),
            note: p.note ?? null,
            active: p.active,
            sourceId: p.sourceId ?? null,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
          })),
        })
      }

      if (payload.data.counters.length > 0) {
        await tx.counter.createMany({
          data: payload.data.counters.map((c) => ({
            key: c.key,
            value: c.value,
          })),
        })
      }

      if (payload.data.invoices.length > 0) {
        await tx.invoice.createMany({
          data: payload.data.invoices.map((inv) => ({
            id: inv.id,
            invoiceNo: inv.invoiceNo,
            customerId:
              inv.customerId && validCustomerIds.has(inv.customerId)
                ? inv.customerId
                : null,
            createdAt: new Date(inv.createdAt),
            subtotal: toDecimal(inv.subtotal),
            discount: toDecimal(inv.discount),
            total: toDecimal(inv.total),
            paid: toDecimal(inv.paid),
            change: toDecimal(inv.change),
            debtIncrease: toDecimal(inv.debtIncrease),
            note: inv.note ?? null,
          })),
        })
      }

      if (filteredInvoiceItems.length > 0) {
        await tx.invoiceItem.createMany({
          data: filteredInvoiceItems.map((it) => ({
            id: it.id,
            invoiceId: it.invoiceId,
            productId: it.productId,
            productNameSnapshot: it.productNameSnapshot,
            categorySnapshot: it.categorySnapshot ?? null,
            unitSnapshot: it.unitSnapshot,
            qty: toDecimal(it.qty),
            unitPrice: toDecimal(it.unitPrice),
            lineTotal: toDecimal(it.lineTotal),
            noteSnapshot: it.noteSnapshot ?? null,
          })),
        })
      }
    })

    console.info('SYNC_PUSH_REPLACE_ALL', {
      at: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      counts,
      ip: request.headers.get('x-forwarded-for') ?? undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })

    return NextResponse.json(
      { ok: true, counts },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('SYNC_PUSH_FAILED', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: 'Invalid reference (missing customer/product/invoice)' },
          { status: 400 }
        )
      }
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Unique constraint violation while importing snapshot' },
          { status: 409 }
        )
      }
    }

    return NextResponse.json({ error: 'Sync push failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const authError = getSyncTokenError(request)
  if (authError) return authError

  try {
    const [users, customers, products, counters, invoices, invoiceItems] =
      await Promise.all([
        prisma.user.findMany({ orderBy: { createdAt: 'asc' } }),
        prisma.customer.findMany({ orderBy: { createdAt: 'asc' } }),
        prisma.product.findMany({ orderBy: { createdAt: 'asc' } }),
        prisma.counter.findMany({ orderBy: { key: 'asc' } }),
        prisma.invoice.findMany({ orderBy: { createdAt: 'asc' } }),
        prisma.invoiceItem.findMany({ orderBy: { id: 'asc' } }),
      ])

    const payload = {
      meta: {
        version: 2,
        exportedAt: new Date().toISOString(),
        appName: APP_NAME,
      },
      data: {
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category ?? undefined,
          unit: p.unit,
          price1: p.price1 === null ? null : Number(p.price1),
          price2: p.price2 === null ? null : Number(p.price2),
          price3: p.price3 === null ? null : Number(p.price3),
          note: p.note ?? undefined,
          active: p.active,
          createdAt: p.createdAt.getTime(),
          updatedAt: p.updatedAt.getTime(),
          sourceId: p.sourceId ?? undefined,
        })),
        customers: customers.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone ?? undefined,
          address: c.address ?? undefined,
          note: c.note ?? undefined,
          debt: Number(c.debt),
          createdAt: c.createdAt.getTime(),
          updatedAt: c.updatedAt.getTime(),
        })),
        invoices: invoices.map((inv) => ({
          id: inv.id,
          invoiceNo: inv.invoiceNo,
          customerId: inv.customerId,
          createdAt: inv.createdAt.getTime(),
          subtotal: Number(inv.subtotal),
          discount: Number(inv.discount),
          total: Number(inv.total),
          paid: Number(inv.paid),
          change: Number(inv.change),
          debtIncrease: Number(inv.debtIncrease),
          note: inv.note ?? undefined,
        })),
        invoiceItems: invoiceItems.map((it) => ({
          id: it.id,
          invoiceId: it.invoiceId,
          productId: it.productId,
          productNameSnapshot: it.productNameSnapshot,
          categorySnapshot: it.categorySnapshot ?? undefined,
          unitSnapshot: it.unitSnapshot,
          qty: Number(it.qty),
          unitPrice: Number(it.unitPrice),
          lineTotal: Number(it.lineTotal),
          noteSnapshot: it.noteSnapshot ?? undefined,
        })),
        counters: counters.map((c) => ({
          key: c.key,
          value: c.value,
        })),
        users: users.map((u) => ({
          id: u.id,
          pinHash: u.pinHash,
          displayName: u.displayName,
          role: u.role,
          active: u.active,
          createdAt: u.createdAt.getTime(),
          updatedAt: u.updatedAt.getTime(),
        })),
      },
    }

    // Validate outgoing payload so clients can import safely.
    BackupPayloadSchema.parse(payload)

    console.info('SYNC_PULL', {
      at: new Date().toISOString(),
      counts: {
        users: payload.data.users.length,
        products: payload.data.products.length,
        customers: payload.data.customers.length,
        invoices: payload.data.invoices.length,
        invoiceItems: payload.data.invoiceItems.length,
        counters: payload.data.counters.length,
      },
      ip: request.headers.get('x-forwarded-for') ?? undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })

    return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('SYNC_PULL_FAILED', error)
    return NextResponse.json({ error: 'Sync pull failed' }, { status: 500 })
  }
}

