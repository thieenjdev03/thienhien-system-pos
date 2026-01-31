# Codebase Summary

**Last Updated**: 2026-01-31

## Project Overview

POS Next UI is a modern Point-of-Sale (POS) system built with Next.js 16, React 19, TypeScript, and Tailwind CSS. The application features a server-side database with Prisma ORM (PostgreSQL), client-side state management, and a comprehensive UI component library.

## Tech Stack

- **Frontend**: Next.js 16.1.3, React 19.2.3, TypeScript 5
- **Styling**: Tailwind CSS 4, SASS 1.97.2
- **Database**: PostgreSQL with Prisma ORM 7.3.0
- **UI Components**: Lucide React, Class Variance Authority, Motion
- **State Management**: React Context (AuthContext), Dexie (IndexedDB for offline)
- **Animation**: Motion 12.27.0

## Directory Structure

```
pos-next-ui/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Authentication routes (group)
│   │   ├── login/               # Login page
│   │   └── setup/               # Initial setup page
│   ├── (dashboard)/             # Dashboard routes (group)
│   │   ├── customers/           # Customer management
│   │   ├── invoices/            # Invoice management
│   │   └── layout.tsx           # Dashboard layout with sidebar
│   ├── api/                     # API routes
│   └── globals.css              # Global styles
├── components/                   # Reusable UI components
│   ├── ui/                      # Base UI components
│   │   ├── Navbar.tsx
│   │   └── Sidebar.tsx
│   └── ProductSearchAddPanel.tsx # Product search component
├── contexts/                     # React contexts
│   └── AuthContext.tsx          # Authentication context
├── lib/                         # Utilities and configurations
│   ├── prisma.ts               # Prisma client singleton
│   └── generated/prisma/       # Generated Prisma types
├── shared/                      # Shared utilities
│   └── i18n/                   # Internationalization
│       └── vi.ts               # Vietnamese translations
├── utils/                       # Utility functions
│   ├── auth.ts                 # Authentication utilities
│   ├── formatters.ts           # Data formatters
│   └── auth.test.ts            # Auth tests
├── prisma/                      # Database configuration
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Database migrations
├── prisma.config.ts            # Prisma configuration
├── public/                      # Static assets
├── .claude/                     # Claude configuration
├── plans/                       # Development plans
├── scripts/                     # Build/dev scripts
└── package.json                # Dependencies

```

## Database Models

### 1. User
- **ID**: CUID (string)
- **pinHash**: User authentication PIN hash
- **displayName**: User display name
- **role**: Enum (admin, cashier)
- **active**: Boolean, default true
- **createdAt**: Timestamp
- **updatedAt**: Timestamp

### 2. Customer
- **ID**: CUID (string)
- **name**: String (indexed)
- **phone**: Optional string (indexed)
- **address**: Optional text
- **note**: Optional text
- **debt**: Decimal(12,2), default 0
- **invoices**: Relation to Invoice
- **createdAt**: Timestamp
- **updatedAt**: Timestamp

### 3. Product
- **ID**: CUID (string)
- **name**: String (indexed)
- **category**: Optional string (indexed)
- **unit**: String
- **price1**: Optional Decimal(10,2)
- **price2**: Optional Decimal(10,2)
- **price3**: Optional Decimal(10,2)
- **note**: Optional text
- **active**: Boolean, default true (indexed)
- **sourceId**: Optional integer
- **items**: Relation to InvoiceItem
- **createdAt**: Timestamp
- **updatedAt**: Timestamp

### 4. Invoice
- **ID**: CUID (string)
- **invoiceNo**: String (unique, indexed)
- **customerId**: Optional string (indexed, foreign key)
- **customer**: Relation to Customer (SetNull on delete)
- **subtotal**: Decimal(12,2)
- **discount**: Decimal(12,2), default 0
- **total**: Decimal(12,2)
- **paid**: Decimal(12,2)
- **change**: Decimal(12,2)
- **debtIncrease**: Decimal(12,2), default 0
- **note**: Optional text
- **items**: Relation to InvoiceItem
- **createdAt**: Timestamp (indexed)

### 5. InvoiceItem
- **ID**: CUID (string)
- **invoiceId**: String (indexed, foreign key, Cascade delete)
- **invoice**: Relation to Invoice
- **productId**: String (indexed, foreign key, Restrict delete)
- **product**: Relation to Product
- **productNameSnapshot**: String (product name at invoice time)
- **categorySnapshot**: Optional string
- **unitSnapshot**: String
- **qty**: Decimal(10,2)
- **unitPrice**: Decimal(10,2)
- **lineTotal**: Decimal(12,2)
- **noteSnapshot**: Optional text

### 6. Counter
- **key**: String (primary key)
- **value**: Integer, default 0
- Used for generating invoice numbers

## Key Features

### Authentication
- PIN-based authentication for users
- Role-based access control (admin/cashier)
- AuthContext for state management
- Token/session management in utils/auth.ts

### Customer Management
- Create/read/update customers
- Track customer debt
- Search by name/phone
- Customer-to-invoices relationship

### Product Management
- Product catalog with three-tier pricing (price1, price2, price3)
- Category and unit tracking
- Active/inactive product status
- Search capability

### Invoice Management
- Create invoices with customer linkage
- Line-item tracking with snapshots (preserves product state at invoice time)
- Discount and change calculation
- Automatic debt tracking
- Invoice numbering via Counter model

### Data Persistence
- Server-side data via PostgreSQL/Prisma
- Client-side caching via Dexie (IndexedDB)
- Offline support capability

## Configuration

### Prisma Configuration (prisma.config.ts)
- Schema path: `prisma/schema.prisma`
- Migrations path: `prisma/migrations`
- Datasource: PostgreSQL via `DATABASE_URL` env var

### Environment Variables (.env.example)
```
DATABASE_URL="postgresql://user:password@localhost:5432/pos_db?schema=public"
```

## Internationalization

Vietnamese translations in `shared/i18n/vi.ts` for:
- UI labels
- Form placeholders
- Error messages
- Menu items

## Development

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Prisma Commands
- `npx prisma generate` - Generate Prisma client
- `npx prisma migrate dev` - Create and apply migrations
- `npx prisma studio` - GUI database explorer

## Data Access Patterns

### Server-Side (Recommended)
- Use Prisma client in server components
- API routes for client interaction
- Server actions for mutations

### Client-Side (Offline)
- Dexie for IndexedDB caching
- Sync with server when online

## Key Dependencies

- **@prisma/client** (7.3.0) - Database ORM
- **prisma** (7.3.0) - Prisma CLI
- **dexie** (4.2.1) - IndexedDB wrapper
- **dexie-react-hooks** (4.2.0) - React hooks for Dexie
- **motion** (12.27.0) - Animation library
- **lucide-react** (0.562.0) - Icon library
- **tailwindcss** (4) - Utility-first CSS

## Migration Status

### Phase 1: Prisma Database Migration (COMPLETE)
- Database schema defined with 6 models
- Initial migration applied (20260128163245_init)
- Prisma client configured
- PostgreSQL connection established
- Proper indexes added for query optimization
- Decimal precision configured for financial data

## Next Steps

1. API route implementation for CRUD operations
2. Server component data fetching
3. Form validation and error handling
4. Offline sync strategy
5. Testing suite
6. Deployment configuration

---

**Maintained By**: Documentation Team
**Repository**: pos-next-ui
