# Hướng dẫn Implement Prisma cho POS Next UI

## 📋 Tổng quan

Project này đã được setup Prisma với Prisma Accelerate (PostgreSQL). Tài liệu này sẽ hướng dẫn bạn cách sử dụng và mở rộng Prisma trong project.

## 🏗️ Cấu trúc hiện tại

```
pos-next-ui/
├── prisma/
│   ├── schema.prisma          # Schema định nghĩa database
│   └── migrations/            # Lịch sử migrations
├── lib/
│   ├── prisma.ts             # Prisma Client instance
│   └── generated/prisma/     # Generated Prisma Client
├── prisma.config.ts          # Prisma configuration
└── .env                      # Database URL
```

## 🔧 Setup đã có

### 1. **Dependencies** (✅ Đã cài)
```json
{
  "@prisma/client": "^7.3.0",
  "prisma": "^7.3.0"
}
```

### 2. **Database Schema** (`prisma/schema.prisma`)

Schema hiện tại bao gồm các models:
- **User**: Quản lý người dùng (admin/cashier)
- **Customer**: Quản lý khách hàng
- **Product**: Quản lý sản phẩm
- **Invoice**: Quản lý hóa đơn
- **InvoiceItem**: Chi tiết hóa đơn
- **Counter**: Đếm số thứ tự

### 3. **Prisma Client** (`lib/prisma.ts`)

Singleton pattern để tránh tạo nhiều connections:
```typescript
import { PrismaClient } from './generated/prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL!,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## 📝 Cách sử dụng Prisma

### 1. **CRUD Operations cơ bản**

#### **Create (Tạo mới)**
```typescript
import { prisma } from '@/lib/prisma'

// Tạo sản phẩm mới
const product = await prisma.product.create({
  data: {
    name: 'Coca Cola',
    category: 'Beverages',
    unit: 'Lon',
    price1: 15000,
    price2: 14000,
    price3: 13000,
    active: true,
  }
})

// Tạo khách hàng mới
const customer = await prisma.customer.create({
  data: {
    name: 'Nguyễn Văn A',
    phone: '0901234567',
    address: 'Hà Nội',
  }
})
```

#### **Read (Đọc dữ liệu)**
```typescript
// Lấy tất cả sản phẩm active
const products = await prisma.product.findMany({
  where: { active: true },
  orderBy: { name: 'asc' }
})

// Lấy một sản phẩm theo ID
const product = await prisma.product.findUnique({
  where: { id: 'clx...' }
})

// Tìm kiếm sản phẩm theo tên
const searchResults = await prisma.product.findMany({
  where: {
    name: {
      contains: 'coca',
      mode: 'insensitive' // Case-insensitive search
    }
  }
})

// Lấy hóa đơn kèm items và customer
const invoice = await prisma.invoice.findUnique({
  where: { id: 'clx...' },
  include: {
    items: {
      include: {
        product: true
      }
    },
    customer: true
  }
})
```

#### **Update (Cập nhật)**
```typescript
// Cập nhật giá sản phẩm
const updated = await prisma.product.update({
  where: { id: 'clx...' },
  data: {
    price1: 16000,
    price2: 15000,
  }
})

// Cập nhật công nợ khách hàng
const customer = await prisma.customer.update({
  where: { id: 'clx...' },
  data: {
    debt: {
      increment: 50000 // Tăng thêm 50k
    }
  }
})
```

#### **Delete (Xóa)**
```typescript
// Xóa sản phẩm (soft delete - nên dùng update thay vì delete)
await prisma.product.update({
  where: { id: 'clx...' },
  data: { active: false }
})

// Hard delete (cẩn thận!)
await prisma.product.delete({
  where: { id: 'clx...' }
})
```

### 2. **Transactions (Giao dịch)**

Khi tạo hóa đơn, cần đảm bảo tính toàn vẹn dữ liệu:

```typescript
import { prisma } from '@/lib/prisma'

async function createInvoice(data: InvoiceData) {
  return await prisma.$transaction(async (tx) => {
    // 1. Tạo invoice
    const invoice = await tx.invoice.create({
      data: {
        invoiceNo: data.invoiceNo,
        customerId: data.customerId,
        subtotal: data.subtotal,
        discount: data.discount,
        total: data.total,
        paid: data.paid,
        change: data.change,
        debtIncrease: data.debtIncrease,
      }
    })

    // 2. Tạo invoice items
    await tx.invoiceItem.createMany({
      data: data.items.map(item => ({
        invoiceId: invoice.id,
        productId: item.productId,
        productNameSnapshot: item.productName,
        categorySnapshot: item.category,
        unitSnapshot: item.unit,
        qty: item.qty,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      }))
    })

    // 3. Cập nhật công nợ khách hàng (nếu có)
    if (data.customerId && data.debtIncrease > 0) {
      await tx.customer.update({
        where: { id: data.customerId },
        data: {
          debt: {
            increment: data.debtIncrease
          }
        }
      })
    }

    // 4. Tăng counter
    await tx.counter.upsert({
      where: { key: 'invoice' },
      update: { value: { increment: 1 } },
      create: { key: 'invoice', value: 1 }
    })

    return invoice
  })
}
```

### 3. **Aggregations & Grouping**

```typescript
// Tổng doanh thu theo ngày
const dailyRevenue = await prisma.invoice.groupBy({
  by: ['createdAt'],
  _sum: {
    total: true,
    paid: true,
  },
  where: {
    createdAt: {
      gte: new Date('2024-01-01'),
      lte: new Date('2024-12-31'),
    }
  }
})

// Đếm số lượng sản phẩm theo category
const productsByCategory = await prisma.product.groupBy({
  by: ['category'],
  _count: {
    id: true
  },
  where: {
    active: true
  }
})

// Tổng công nợ
const totalDebt = await prisma.customer.aggregate({
  _sum: {
    debt: true
  },
  where: {
    debt: {
      gt: 0
    }
  }
})
```

### 4. **API Routes với Prisma**

#### **GET - Lấy danh sách**
```typescript
// app/api/products/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category')
    
    const products = await prisma.product.findMany({
      where: {
        active: true,
        ...(search && {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        }),
        ...(category && { category })
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
```

#### **POST - Tạo mới**
```typescript
// app/api/products/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const product = await prisma.product.create({
      data: {
        name: body.name,
        category: body.category,
        unit: body.unit,
        price1: body.price1,
        price2: body.price2,
        price3: body.price3,
        note: body.note,
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
```

#### **PUT - Cập nhật**
```typescript
// app/api/products/[id]/route.ts
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: body.name,
        category: body.category,
        unit: body.unit,
        price1: body.price1,
        price2: body.price2,
        price3: body.price3,
        note: body.note,
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}
```

### 5. **Server Components với Prisma**

```typescript
// app/(dashboard)/products/page.tsx
import { prisma } from '@/lib/prisma'

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { name: 'asc' }
  })

  return (
    <div>
      <h1>Products</h1>
      <ul>
        {products.map(product => (
          <li key={product.id}>
            {product.name} - {product.price1}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

## 🔄 Workflow thêm/sửa Schema

### 1. **Thêm field mới vào model**

```prisma
// prisma/schema.prisma
model Product {
  id        String   @id @default(cuid())
  name      String
  // ... existing fields
  barcode   String?  // ← Thêm field mới
  stock     Int      @default(0) // ← Thêm field mới
}
```

### 2. **Tạo migration**

```bash
npx prisma migrate dev --name add_barcode_and_stock
```

### 3. **Generate Prisma Client**

```bash
npx prisma generate
```

### 4. **Sử dụng field mới**

```typescript
const product = await prisma.product.create({
  data: {
    name: 'Product',
    barcode: '1234567890',
    stock: 100,
    // ...
  }
})
```

## 🆕 Thêm Model mới

### 1. **Định nghĩa model trong schema**

```prisma
// prisma/schema.prisma
model Supplier {
  id        String    @id @default(cuid())
  name      String
  phone     String?
  email     String?
  address   String?   @db.Text
  products  Product[] // Relation
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([name])
}

// Thêm relation vào Product
model Product {
  // ... existing fields
  supplierId String?
  supplier   Supplier? @relation(fields: [supplierId], references: [id])
}
```

### 2. **Tạo migration**

```bash
npx prisma migrate dev --name add_supplier_model
```

### 3. **Generate client**

```bash
npx prisma generate
```

### 4. **Sử dụng model mới**

```typescript
// Tạo supplier
const supplier = await prisma.supplier.create({
  data: {
    name: 'ABC Company',
    phone: '0901234567',
    email: 'abc@example.com',
  }
})

// Lấy supplier kèm products
const supplierWithProducts = await prisma.supplier.findUnique({
  where: { id: supplier.id },
  include: {
    products: true
  }
})
```

## 🛠️ Commands thường dùng

```bash
# Generate Prisma Client (sau khi sửa schema)
npx prisma generate

# Tạo migration mới
npx prisma migrate dev --name <migration_name>

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (⚠️ XÓA TẤT CẢ DỮ LIỆU)
npx prisma migrate reset

# Mở Prisma Studio (GUI để xem/sửa data)
npx prisma studio

# Format schema file
npx prisma format

# Validate schema
npx prisma validate

# Pull schema từ database
npx prisma db pull

# Push schema lên database (không tạo migration)
npx prisma db push
```

## 💡 Best Practices

### 1. **Luôn dùng Transactions cho operations phức tạp**
```typescript
// ✅ GOOD
await prisma.$transaction([
  prisma.invoice.create({ data: invoiceData }),
  prisma.customer.update({ where: { id }, data: { debt: newDebt } })
])

// ❌ BAD - Có thể bị inconsistent
await prisma.invoice.create({ data: invoiceData })
await prisma.customer.update({ where: { id }, data: { debt: newDebt } })
```

### 2. **Sử dụng select/include để tối ưu query**
```typescript
// ✅ GOOD - Chỉ lấy fields cần thiết
const products = await prisma.product.findMany({
  select: {
    id: true,
    name: true,
    price1: true,
  }
})

// ❌ BAD - Lấy tất cả fields (tốn bandwidth)
const products = await prisma.product.findMany()
```

### 3. **Thêm indexes cho fields thường query**
```prisma
model Product {
  name String
  
  @@index([name]) // ← Tăng tốc độ search by name
}
```

### 4. **Sử dụng Soft Delete thay vì Hard Delete**
```typescript
// ✅ GOOD
await prisma.product.update({
  where: { id },
  data: { active: false }
})

// ❌ BAD - Mất data vĩnh viễn
await prisma.product.delete({ where: { id } })
```

### 5. **Handle errors properly**
```typescript
try {
  const result = await prisma.product.create({ data })
  return result
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      throw new Error('Unique constraint violation')
    }
  }
  throw error
}
```

### 6. **Sử dụng Environment Variables**
```env
# .env
DATABASE_URL="prisma+postgres://..."
```

### 7. **Pagination cho large datasets**
```typescript
const products = await prisma.product.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' }
})
```

## 🔍 Debugging

### 1. **Enable query logging**
```typescript
// lib/prisma.ts
new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], // ← Xem tất cả queries
})
```

### 2. **Sử dụng Prisma Studio**
```bash
npx prisma studio
# Mở http://localhost:5555
```

### 3. **Check migration status**
```bash
npx prisma migrate status
```

## 📚 Tài liệu tham khảo

- [Prisma Docs](https://www.prisma.io/docs)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Accelerate](https://www.prisma.io/docs/accelerate)

## 🎯 Next Steps

1. ✅ Schema đã được định nghĩa
2. ✅ Prisma Client đã được setup
3. ✅ Database connection đã sẵn sàng
4. 🔄 Tạo API routes cho CRUD operations
5. 🔄 Implement business logic với Prisma
6. 🔄 Thêm validation và error handling

---

**Lưu ý**: Project này sử dụng **Prisma Accelerate** với PostgreSQL. Database URL đã được config trong `.env` file.
