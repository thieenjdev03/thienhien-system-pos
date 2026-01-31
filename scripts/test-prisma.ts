/**
 * Test script to verify Prisma connection
 * Run: npx tsx scripts/test-prisma.ts
 */
import 'dotenv/config'
import { prisma } from '../lib/prisma'

async function main() {
  console.log('Testing Prisma connection...')

  // Test User model
  const users = await prisma.user.findMany()
  console.log('✓ User model works - found', users.length, 'users')

  // Test Counter model
  const counters = await prisma.counter.findMany()
  console.log('✓ Counter model works - found', counters.length, 'counters')

  // Test Product model
  const products = await prisma.product.findMany()
  console.log('✓ Product model works - found', products.length, 'products')

  console.log('\n✓ All Prisma models validated successfully!')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
