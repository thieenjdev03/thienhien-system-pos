/**
 * Example: Products Dashboard Page
 * Server Component using Prisma directly
 */

import { productRepo } from '@/repos/productRepo.prisma'
import Link from 'next/link'

export default async function ProductsDashboardPage() {
  // Fetch data directly in Server Component
  const products = await productRepo.list({ active: true, limit: 20 })
  const categories = await productRepo.getCategories()
  const totalProducts = await productRepo.count({ active: true })

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Products Dashboard</h1>
        <p className="text-gray-600">Total active products: {totalProducts}</p>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category}
              href={`/products?category=${encodeURIComponent(category)}`}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            >
              {category}
            </Link>
          ))}
        </div>
      </div>

      {/* Products List */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Recent Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <h3 className="font-semibold text-lg">{product.name}</h3>
              {product.category && (
                <p className="text-sm text-gray-500">{product.category}</p>
              )}
              <div className="mt-2">
                <p className="text-sm">Unit: {product.unit}</p>
                <div className="flex gap-2 mt-1">
                  {product.price1 && (
                    <span className="text-green-600 font-semibold">
                      ${Number(product.price1).toFixed(2)}
                    </span>
                  )}
                  {product.price2 && (
                    <span className="text-gray-500 text-sm">
                      ${Number(product.price2).toFixed(2)}
                    </span>
                  )}
                  {product.price3 && (
                    <span className="text-gray-500 text-sm">
                      ${Number(product.price3).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              {product.note && (
                <p className="text-sm text-gray-600 mt-2">{product.note}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <Link
        href="/products"
        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        View All Products
      </Link>
    </div>
  )
}
