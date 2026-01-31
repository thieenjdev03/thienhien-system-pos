/**
 * Invoices API Routes
 * GET /api/invoices - List invoices with filters
 * POST /api/invoices - Create a new invoice
 */

import { NextRequest, NextResponse } from 'next/server'
import { invoiceRepo } from '@/repos/invoiceRepo.prisma'
import { Prisma } from '@/lib/generated/prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const customerId = searchParams.get('customerId') || undefined
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const invoices = await invoiceRepo.list({
      customerId,
      startDate,
      endDate,
      limit,
      offset,
    })

    const total = await invoiceRepo.count({
      customerId,
      startDate,
      endDate,
    })

    return NextResponse.json({
      data: invoices,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + invoices.length < total,
      },
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Invoice must have at least one item' },
        { status: 400 }
      )
    }

    // Generate invoice number if not provided
    const invoiceNo = body.invoiceNo || await invoiceRepo.getNextInvoiceNo()

    // Create invoice with transaction
    const invoice = await invoiceRepo.create({
      invoiceNo,
      customerId: body.customerId,
      subtotal: body.subtotal,
      discount: body.discount || 0,
      total: body.total,
      paid: body.paid,
      change: body.change,
      debtIncrease: body.debtIncrease || 0,
      note: body.note,
      items: body.items,
    })

    // Fetch full invoice details
    const fullInvoice = await invoiceRepo.getById(invoice.id)

    return NextResponse.json(fullInvoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Invoice number already exists' },
          { status: 409 }
        )
      }
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: 'Invalid customer or product reference' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
