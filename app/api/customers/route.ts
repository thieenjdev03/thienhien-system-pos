/**
 * Customers API Routes
 * GET /api/customers - List customers with search/filters
 * POST /api/customers - Create a new customer
 */

import { NextRequest, NextResponse } from 'next/server'
import { customerRepo } from '@/repos/customerRepo.prisma'
import { Prisma } from '@/lib/generated/prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search') || undefined
    const hasDebtParam = searchParams.get('hasDebt')
    const hasDebt =
      hasDebtParam === null ? undefined : hasDebtParam === 'true'
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const customers = await customerRepo.list({
      search,
      hasDebt,
      limit,
      offset,
    })

    const total = await customerRepo.count({
      search,
      hasDebt,
    })

    return NextResponse.json({
      data: customers,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + customers.length < total,
      },
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const customer = await customerRepo.create({
      name: body.name,
      phone: body.phone,
      address: body.address,
      note: body.note,
      debt: body.debt ?? 0,
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // For future: handle unique phone, etc.
    }

    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}

