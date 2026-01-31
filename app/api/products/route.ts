/**
 * Products API Routes
 * GET /api/products - List products with search and filters
 * POST /api/products - Create a new product
 */

import { NextRequest, NextResponse } from 'next/server'
import { productRepo } from '@/repos/productRepo.prisma'
import { Prisma } from '@/lib/generated/prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const search = searchParams.get('search') || undefined
    const category = searchParams.get('category') || undefined
    const active = searchParams.get('active') !== 'false' // Default true
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const products = await productRepo.list({
      search,
      category,
      active,
      limit,
      offset,
    })

    const total = await productRepo.count({
      search,
      category,
      active,
    })

    return NextResponse.json({
      data: products,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + products.length < total,
      },
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.unit) {
      return NextResponse.json(
        { error: 'Name and unit are required' },
        { status: 400 }
      )
    }

    // Check if product already exists
    const exists = await productRepo.existsByKey(
      body.name,
      body.category || null,
      body.unit
    )

    if (exists) {
      return NextResponse.json(
        { error: 'Product with same name, category, and unit already exists' },
        { status: 409 }
      )
    }

    const product = await productRepo.create({
      name: body.name,
      category: body.category,
      unit: body.unit,
      price1: body.price1,
      price2: body.price2,
      price3: body.price3,
      note: body.note,
      active: body.active ?? true,
      sourceId: body.sourceId,
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Product already exists' },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
