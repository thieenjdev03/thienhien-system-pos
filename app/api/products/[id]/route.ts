/**
 * Single Product API Routes
 * GET /api/products/[id] - Get product by ID
 * PUT /api/products/[id] - Update product
 * DELETE /api/products/[id] - Soft delete product
 */

import { NextRequest, NextResponse } from 'next/server'
import { productRepo } from '@/repos/productRepo.prisma'
import { Prisma } from '@/lib/generated/prisma/client'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const product = await productRepo.getById(id)

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()

    // Check if product exists
    const existing = await productRepo.getById(id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const product = await productRepo.update(id, {
      name: body.name,
      category: body.category,
      unit: body.unit,
      price1: body.price1,
      price2: body.price2,
      price3: body.price3,
      note: body.note,
      active: body.active,
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const hard = searchParams.get('hard') === 'true'

    if (hard) {
      // Hard delete (use with caution!)
      await productRepo.hardDelete(id)
    } else {
      // Soft delete (default)
      await productRepo.softDelete(id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: 'Cannot delete product that is referenced in invoices' },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
