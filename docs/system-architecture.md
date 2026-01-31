# System Architecture

**Last Updated**: 2026-01-31
**Version**: 1.0
**Phase**: Database Layer Complete (Phase 1)

## Architecture Overview

POS Next UI employs a modern three-tier architecture with Next.js serving as the unified application framework, PostgreSQL with Prisma for the data layer, and React for the presentation layer.

```
┌─────────────────────────────────────────────────────────────────┐
│                       CLIENT LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   React      │  │   Tailwind   │  │   Lucide Icons       │  │
│  │  Components  │  │   CSS / SASS │  │   Motion Animations  │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└────────────────────────────┬──────────────────────────────────────┘
                             │
┌────────────────────────────▼──────────────────────────────────────┐
│                    APPLICATION LAYER                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │  Next.js Router  │  │  API Routes      │  │  Server        │  │
│  │  (App Router)    │  │  /api/*          │  │  Components    │  │
│  └──────────────────┘  └──────────────────┘  └────────────────┘  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │  AuthContext     │  │  Utils (auth,    │  │  Middleware    │  │
│  │                  │  │  formatters)     │  │                │  │
│  └──────────────────┘  └──────────────────┘  └────────────────┘  │
└────────────────────────────┬──────────────────────────────────────┘
                             │
┌────────────────────────────▼──────────────────────────────────────┐
│                     DATA ACCESS LAYER                             │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │           Prisma ORM (Client Singleton)                      │ │
│  │  - CRUD operations                                           │ │
│  │  - Transactions & atomicity                                  │ │
│  │  - Relationships & eager loading                             │ │
│  │  - Query optimization with indexes                           │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬──────────────────────────────────────┘
                             │
┌────────────────────────────▼──────────────────────────────────────┐
│                    DATABASE LAYER                                 │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │         PostgreSQL (Primary Data Store)                       │ │
│  │  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌────────────┐     │ │
│  │  │ User    │  │Customer │  │ Product  │  │  Invoice   │     │ │
│  │  └─────────┘  └─────────┘  └──────────┘  └────────────┘     │ │
│  │  ┌──────────────┐  ┌──────────┐                              │ │
│  │  │ InvoiceItem  │  │ Counter  │                              │ │
│  │  └──────────────┘  └──────────┘                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │        IndexedDB (Dexie - Offline Cache)                      │ │
│  │  Syncs with PostgreSQL when connection available             │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

## Detailed Component Architecture

### 1. Presentation Layer

#### Pages & Routing (Next.js App Router)
```
app/
├── (auth)                    # Authentication group
│   ├── login/page.tsx       # Login page
│   └── setup/page.tsx       # Initial setup
├── (dashboard)              # Protected group
│   ├── customers/           # Customer module
│   │   ├── page.tsx        # List customers
│   │   └── CustomerForm.tsx # Add/edit customer
│   ├── invoices/            # Invoice module
│   │   ├── new/page.tsx    # Create invoice
│   │   ├── [id]/page.tsx   # View invoice detail
│   │   └── components/     # Invoice-specific components
│   └── layout.tsx          # Shared dashboard layout
```

#### UI Components
- **Base Components**: `components/ui/` - Reusable, style-agnostic
  - `Navbar.tsx` - Top navigation
  - `Sidebar.tsx` - Dashboard sidebar

- **Feature Components**: `components/` - Feature-specific
  - `ProductSearchAddPanel.tsx` - Search and add products
  - `CustomerForm.tsx` - Customer form
  - `InvoiceForm.tsx` - Invoice creation (TBD)

#### Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **SASS** - For complex styling needs
- **Class Variance Authority** - Type-safe component variants
- **Lucide React** - Consistent icon library

### 2. Application Layer

#### Authentication & Authorization
**File**: `contexts/AuthContext.tsx` + `utils/auth.ts`

Features:
- PIN-based user authentication
- Role-based access control (admin/cashier)
- Session management
- Context provider for app-wide auth state

```typescript
// Auth context provides:
- currentUser
- isAuthenticated
- userRole
- login(pin: string)
- logout()
```

#### State Management
- **Context API**: AuthContext for global auth state
- **React Hooks**: useState, useReducer for component state
- **Dexie**: IndexedDB for offline persistence

#### API Routes
Location: `app/api/*`
- RESTful endpoints for CRUD operations
- Server-side validation
- Error handling middleware
- Database queries via Prisma

### 3. Data Access Layer

#### Prisma Client Configuration
**File**: `lib/prisma.ts`

```typescript
// Singleton pattern to avoid connection exhaustion
const prisma = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['warn', 'error']
    : ['error']
})

// Global assignment in development for hot reload
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}
```

**Key Patterns**:
- Singleton instance prevents connection exhaustion
- Logging configuration per environment
- Generated types for type safety

#### Database Schema
**File**: `prisma/schema.prisma`

Key Design Decisions:
1. **CUID for primary keys** - Better distributed systems support than auto-increment
2. **Decimal precision** - `@db.Decimal(12, 2)` for financial data (money fields)
3. **Snapshots in InvoiceItem** - Preserves product/category data at invoice time
4. **Soft deletes** - Use `active: Boolean` instead of hard deletes for audit trail
5. **Indexes** - Strategic indexes on frequently queried fields
   - Customer: name, phone
   - Product: name, category, active
   - Invoice: customerId, createdAt, invoiceNo
   - InvoiceItem: invoiceId, productId

#### Relationships

| Model | Relation | Type | Delete Policy |
|-------|----------|------|----------------|
| Invoice → Customer | customerId | N:1 | SetNull |
| InvoiceItem → Invoice | invoiceId | N:1 | Cascade |
| InvoiceItem → Product | productId | N:1 | Restrict |
| Customer → Invoice | invoices | 1:N | - |
| Product → InvoiceItem | items | 1:N | - |

### 4. Database Layer

#### PostgreSQL Schema

**User Table**
```sql
- Stores application users
- PIN-based auth (pinHash field)
- Role-based access
- Soft deletion via 'active' flag
```

**Customer Table**
```sql
- Customer master data
- Debt tracking (Decimal 12,2)
- Indexed on name and phone for search
```

**Product Table**
```sql
- Product catalog
- Three price tiers (price1, price2, price3)
- Indexed on name, category, active for fast queries
```

**Invoice Table**
```sql
- Invoice headers
- Links to customer (nullable for counter sales)
- All decimal fields for accurate financial calculations
- Unique invoiceNo per transaction
```

**InvoiceItem Table**
```sql
- Invoice line items
- Snapshots of product data at invoice time
- Cascade delete with invoice
```

**Counter Table**
```sql
- Sequential ID generation
- Used for invoice numbering
- Key-value structure for extensibility
```

#### Indexes Strategy

```sql
-- Customer
CREATE INDEX Customer_name_idx ON Customer(name);
CREATE INDEX Customer_phone_idx ON Customer(phone);

-- Product
CREATE INDEX Product_name_idx ON Product(name);
CREATE INDEX Product_category_idx ON Product(category);
CREATE INDEX Product_active_idx ON Product(active);

-- Invoice
CREATE UNIQUE INDEX Invoice_invoiceNo_key ON Invoice(invoiceNo);
CREATE INDEX Invoice_customerId_idx ON Invoice(customerId);
CREATE INDEX Invoice_createdAt_idx ON Invoice(createdAt);

-- InvoiceItem
CREATE INDEX InvoiceItem_invoiceId_idx ON InvoiceItem(invoiceId);
CREATE INDEX InvoiceItem_productId_idx ON InvoiceItem(productId);
```

**Rationale**:
- name/phone on Customer: Common search fields
- name/category/active on Product: Filter and search operations
- invoiceNo: Unique constraint for data integrity
- createdAt on Invoice: Date range queries for reporting
- Foreign keys: Fast relationship loading

## Data Flow

### Create Invoice Flow
```
1. User enters invoice details (products, customer, payment)
   ↓
2. Frontend validates input (client-side)
   ↓
3. POST /api/invoices with invoice data
   ↓
4. Server validates & sanitizes (server-side)
   ↓
5. Prisma transaction begins:
   a. Create Invoice record
   b. Create multiple InvoiceItem records
   c. Update Customer debt (if applicable)
   d. Increment Counter for next invoice number
   ↓
6. Transaction commits (all-or-nothing)
   ↓
7. Return invoice with ID to frontend
   ↓
8. Sync to IndexedDB for offline access
```

### Query Product Flow
```
1. Customer searches for product
   ↓
2. Frontend debounces input (500ms)
   ↓
3. GET /api/products?search=term
   ↓
4. Prisma.product.findMany({
     where: { name: { contains: term, mode: 'insensitive' }, active: true },
     orderBy: { name: 'asc' }
   })
   ↓
5. Database uses index on (name, active) for fast filtering
   ↓
6. Return matching products
   ↓
7. Cache in IndexedDB
```

## Security Architecture

### Authentication
- PIN-based: 4-6 digit PIN hashed with bcrypt
- Session management via JWT or server-side sessions
- Role-based authorization on API routes

### Data Protection
- SQL injection prevention via Prisma (parameterized queries)
- XSS prevention via React escaping
- CSRF protection via SameSite cookies
- Sensitive data in environment variables

### Database
- Indexed for query performance
- Foreign key constraints for referential integrity
- Decimal precision for financial accuracy

## Performance Optimization

### Database
1. **Indexes**: Strategic indexes on common query fields
2. **Pagination**: Implement skip/take for large datasets
3. **Selective loading**: Use select/include to fetch only needed fields
4. **Transactions**: Batch operations for atomicity

### Frontend
1. **Code splitting**: Next.js automatic route splitting
2. **Image optimization**: Next.js Image component (if images added)
3. **Lazy loading**: React.lazy for heavy components
4. **Caching**: Dexie for offline support and reduced API calls

### API
1. **Compression**: gzip compression via Next.js
2. **Caching headers**: Set appropriate cache control
3. **Database query optimization**: N+1 query prevention via include/select

## Configuration Management

### Environment Variables
```
DATABASE_URL=postgresql://...  # Database connection
NODE_ENV=development|production
```

### Prisma Configuration (prisma.config.ts)
```typescript
{
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL }
}
```

## Deployment Architecture

### Development
```
Local PostgreSQL ← → Prisma Client ← → Next.js Dev Server
                                    ↓
                              IndexedDB (Browser)
```

### Production
```
Production PostgreSQL ← → Prisma Client ← → Next.js Server
                                        ↓
                                   Browser Cache
```

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| ORM | Prisma 7.x | Type-safe, schema-first, excellent DX |
| Database | PostgreSQL | Robust, supports DECIMAL for money, production-ready |
| Frontend | Next.js 16 | Full-stack React, SSR, API routes, great DX |
| Styling | Tailwind CSS | Utility-first, fast development, great theming |
| ID Generation | CUID | Better for distributed systems than auto-increment |
| Number Precision | Decimal(12,2) | Prevents floating-point errors in money calculations |
| Offline | Dexie | Simple IndexedDB wrapper, React hooks support |

## Future Architecture Considerations

1. **Caching Layer**: Redis for session/query caching
2. **Message Queue**: For async operations (e.g., invoice printing)
3. **Microservices**: Split invoicing, reporting, user management if scale requires
4. **GraphQL**: Alternative to REST if query complexity increases
5. **API Gateway**: For rate limiting, API versioning at scale
6. **Search**: Elasticsearch for advanced product search
7. **Real-time**: WebSockets for multi-user sync (if needed)

---

**Diagram Legend**:
- Solid lines = Direct data flow
- Dotted lines = Optional/async flow
- ↔ = Bidirectional sync

**Last reviewed**: 2026-01-31
