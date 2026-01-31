/**
 * Example: Sales Statistics Page
 * Server Component with advanced Prisma queries
 */

import { invoiceRepo } from '@/repos/invoiceRepo.prisma'
import { customerRepo } from '@/repos/customerRepo.prisma'

export default async function SalesStatsPage() {
  // Get date range (last 30 days)
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  // Fetch statistics
  const [stats, topProducts, recentInvoices, totalDebt] = await Promise.all([
    invoiceRepo.getSalesStats(startDate, endDate),
    invoiceRepo.getTopSellingProducts(10, startDate, endDate),
    invoiceRepo.getRecent(5),
    customerRepo.getTotalDebt(),
  ])

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Sales Statistics (Last 30 Days)</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-gray-500 text-sm font-medium">Total Sales</h3>
          <p className="text-3xl font-bold text-blue-600">
            ${stats.total.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {stats.count} invoices
          </p>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-gray-500 text-sm font-medium">Total Paid</h3>
          <p className="text-3xl font-bold text-green-600">
            ${stats.paid.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {((stats.paid / stats.total) * 100).toFixed(1)}% of total
          </p>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-gray-500 text-sm font-medium">Total Discount</h3>
          <p className="text-3xl font-bold text-orange-600">
            ${stats.discount.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {((stats.discount / stats.subtotal) * 100).toFixed(1)}% of subtotal
          </p>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-gray-500 text-sm font-medium">Outstanding Debt</h3>
          <p className="text-3xl font-bold text-red-600">
            ${totalDebt.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            All customers
          </p>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Top Selling Products</h2>
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Qty Sold
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topProducts.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.product?.name || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {item.product?.category || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">
                      {item.totalQty.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-semibold text-green-600">
                      ${item.totalRevenue.toFixed(2)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Invoices */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Recent Invoices</h2>
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Invoice No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Paid
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-blue-600">
                      {invoice.invoiceNo}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {invoice.customer?.name || 'Walk-in'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      ${Number(invoice.total).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-green-600">
                      ${Number(invoice.paid).toFixed(2)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
