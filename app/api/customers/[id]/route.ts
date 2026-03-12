/**
 * Single Customer API Routes
 * GET    /api/customers/[id] - Get customer by ID
 * PUT    /api/customers/[id] - Update customer
 * DELETE /api/customers/[id] - Delete customer
 */

import { NextRequest, NextResponse } from 'next/server'
import { customerRepo } from '@/repos/customerRepo.prisma'
import { Prisma } from '@/lib/generated/prisma/client'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const customer = await customerRepo.getById(id)

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 },
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const body = await request.json()

    // Ensure customer exists
    const existing = await customerRepo.getById(id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 },
      )
    }

    const customer = await customerRepo.update(id, {
      name: body.name,
      phone: body.phone,
      address: body.address,
      note: body.note,
      debt: body.debt,
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error updating customer:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 },
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params

    await customerRepo.delete(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting customer:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 },
        )
      }
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: 'Cannot delete customer that is referenced in invoices' },
          { status: 409 },
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 },
    )
  }
}

