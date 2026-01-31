## POS System - Tài liệu tổng quan

### 1. Giới thiệu

**POS System** là ứng dụng quản lý bán hàng (Point of Sale) được xây dựng với **Next.js 16**, **React 19**, và **Dexie (IndexedDB)**. Ứng dụng hoạt động **offline-first**, lưu trữ dữ liệu cục bộ trên trình duyệt, không cần server backend.

- **Framework**: Next.js 16.1.3 (App Router)
- **UI Library**: React 19.2.3
- **Database**: Dexie 4.2.1 (IndexedDB wrapper)
- **Styling**: TailwindCSS 4
- **Language**: TypeScript 5
- **State Management**: React Context API + Dexie React Hooks

---

### 2. Cấu trúc thư mục

```text
pos-next-ui/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group: Authentication pages
│   │   ├── bin-setup/            # Thiết lập mã BIN thiết bị
│   │   ├── login/                # Trang đăng nhập
│   │   ├── setup/                # Thiết lập tài khoản đầu tiên
│   │   └── layout.tsx            # Layout cho auth pages
│   ├── (dashboard)/              # Route group: Dashboard pages (protected)
│   │   ├── customers/            # Quản lý khách hàng
│   │   ├── invoices/             # Quản lý hóa đơn
│   │   │   ├── new/              # Tạo hóa đơn mới
│   │   │   └── [id]/             # Chi tiết hóa đơn
│   │   ├── products/             # Quản lý sản phẩm
│   │   ├── page.tsx              # Dashboard home
│   │   └── layout.tsx            # Layout với Sidebar + Navbar
│   ├── layout.tsx                # Root layout (AuthProvider)
│   └── globals.css               # Global styles + Tailwind components
├── components/                   # React components
│   ├── ui/                       # UI components (Button, Navbar, Sidebar)
│   ├── AppShell.tsx              # App shell wrapper (deprecated)
│   ├── BackupPanel.tsx           # Backup/restore component
│   ├── CustomerSelect.tsx        # Customer dropdown selector
│   ├── Modal.tsx                 # Reusable modal
│   ├── ProductSearch.tsx         # Product search component
│   └── ProductSearchAddPanel.tsx # Product search + add to cart
├── contexts/                     # React Context providers
│   └── AuthContext.tsx           # Authentication context
├── db/                           # Database configuration
│   └── index.ts                  # Dexie database setup
├── domain/                       # Domain models & schemas
│   ├── models.ts                 # TypeScript interfaces
│   └── schemas.ts                # Zod validation schemas
├── repos/                        # Data access layer (repositories)
│   ├── backupRepo.ts             # Backup/restore operations
│   ├── customerRepo.ts           # Customer CRUD
│   ├── invoiceRepo.ts            # Invoice CRUD + business logic
│   └── productRepo.ts            # Product CRUD + bulk import
├── shared/                       # Shared resources
│   └── i18n/
│       └── vi.ts                 # Vietnamese localization
├── utils/                        # Utility functions
│   ├── auth.ts                   # PIN hashing, BIN utilities
│   ├── formatters.ts             # Currency, date formatting
│   ├── sort.ts                   # Product sorting utilities
│   └── number-to-vietnamese-words.ts  # Number to words converter
└── lib/                          # Library utilities
    └── utils.ts                  # cn() helper (clsx + tailwind-merge)
```

---

### 3. Kiến trúc hệ thống

#### 3.1. Luồng xác thực (Authentication Flow)

1. App khởi động  
2. `AuthContext` kiểm tra:
   - localStorage có session? → Auto login nếu chưa hết hạn  
   - localStorage có BIN? → Set bin state  
3. Route protection:
   - `(auth)/*` → Chỉ hiển thị khi **chưa login**  
   - `(dashboard)/*` → Redirect tới `/login` nếu **chưa có session**  
4. Setup flow (lần đầu):
   - `/bin-setup` → Nhập mã BIN (6–12 ký tự)  
   - `/setup` → Tạo PIN (4–6 số) → Hash SHA‑256 → Lưu vào `db.users`  
   - `/login` → Nhập PIN → Verify → Tạo session → Lưu `localStorage`

**Lưu trữ:**

- **User**: IndexedDB (`db.users`) – `pinHash`, `displayName`, `role`, `active`
- **Session**: localStorage (`pos_auth_session`) – `userId`, `displayName`, `role`, `expiresAt` (24h)
- **BIN**: localStorage (`pos_device_bin`) – mã định danh thiết bị

#### 3.2. Database Schema (IndexedDB)

- **Database name**: `pos-mvp-db`  
- **Schema version**: 3

**Bảng chính:**

- **products**
  - **Indexes**: `id`, `name`, `category`, `active`, `createdAt`
  - **Fields**: `id`, `name`, `category?`, `unit`, `price1/2/3`, `note?`, `active`, `createdAt`, `updatedAt`, `sourceId?`
- **customers**
  - **Indexes**: `id`, `name`, `phone`, `createdAt`
  - **Fields**: `id`, `name`, `phone?`, `address?`, `note?`, `debt`, `createdAt`, `updatedAt`
- **invoices**
  - **Indexes**: `id`, `invoiceNo`, `customerId`, `createdAt`
  - **Fields**: `id`, `invoiceNo` (HD‑YYYY‑XXXXXX), `customerId?`, `createdAt`, `subtotal`, `discount`, `total`, `paid`, `change`, `debtIncrease`, `note?`
- **invoiceItems**
  - **Indexes**: `id`, `invoiceId`, `productId`
  - **Fields**: `id`, `invoiceId`, `productId`, `productNameSnapshot`, `categorySnapshot?`, `unitSnapshot`, `qty`, `unitPrice`, `lineTotal`, `noteSnapshot?`
- **counters**
  - **Indexes**: `key` (primary)
  - **Fields**: `key` (VD: `"invoice_2025"`), `value`
- **users**
  - **Indexes**: `id`, `displayName`, `role`, `active`
  - **Fields**: `id`, `pinHash`, `displayName`, `role ('admin' | 'cashier')`, `active`, `createdAt`, `updatedAt`

#### 3.3. Repository Pattern

Mỗi domain entity có một repository trong `repos/`:

- **productRepo**: CRUD products, bulk import (upsert/replace), soft delete  
- **customerRepo**: CRUD customers, update debt  
- **invoiceRepo**: Tạo invoice với transaction, generate invoice number, tính `debtIncrease`  
- **backupRepo**: Export/import toàn bộ dữ liệu (JSON)

**Lợi ích:**

- Tách biệt business logic khỏi UI  
- Dễ test và maintain  
- Hỗ trợ transaction (atomic operations)

---

### 4. Chức năng chính

#### 4.1. Quản lý sản phẩm (`/products`)

- **Chức năng:**
  - ✅ Thêm/sửa/xóa sản phẩm (soft delete)
  - ✅ 3 mức giá (`price1`, `price2`, `price3`)
  - ✅ Phân loại theo `category`
  - ✅ Tìm kiếm theo tên/category
  - ✅ Sắp xếp theo `name` / `category` / `updatedAt`
  - ✅ Import hàng loạt từ JSON (upsert hoặc replace)
  - ✅ Dashboard stats: tổng số, đang bán, ngưng bán, số nhóm hàng
- **Components:**
  - `ProductsPage.tsx`: Trang chính với bảng + filters
  - `ProductForm.tsx`: Modal form thêm/sửa
  - `ImportProductsJsonModal.tsx`: Modal import JSON

#### 4.2. Quản lý khách hàng (`/customers`)

- **Chức năng:**
  - ✅ Thêm/sửa/xóa khách hàng
  - ✅ Quản lý công nợ (`debt`)
  - ✅ Tìm kiếm theo tên/SĐT
  - ✅ Hiển thị công nợ hiện tại
- **Components:**
  - `CustomersPage.tsx`: Trang danh sách
  - `CustomerForm.tsx`: Form thêm/sửa
  - `CustomerSelect.tsx`: Dropdown selector (dùng trong invoice)

#### 4.3. Quản lý hóa đơn (`/invoices`)

##### 4.3.1. Danh sách hóa đơn (`/invoices`)

- ✅ Xem danh sách hóa đơn (mới nhất trước)
- ✅ Hiển thị: số HD, khách hàng, ngày tạo, tổng tiền, đã trả, tiền thừa, công nợ phát sinh
- ✅ Click vào hàng → Xem chi tiết

##### 4.3.2. Tạo hóa đơn mới (`/invoices/new`)

- **Layout 2 cột:**
  - **Trái**: Workflow (chọn khách → chọn sản phẩm → giỏ hàng → ghi chú)
  - **Phải**: Thanh toán (sticky, hiển thị tổng, giảm giá, khách đưa, tiền thừa, công nợ)
- ✅ Chọn khách hàng: search dropdown hoặc **Bán lẻ**
- ✅ Chọn mức giá: radio buttons (Giá 1/2/3)
- ✅ Tìm sản phẩm: search với debounce, keyboard navigation (↑ ↓ Enter)
- ✅ Giỏ hàng: tăng/giảm số lượng, chỉnh giá, xóa dòng
- ✅ Tính toán tự động: tạm tính, giảm giá, tổng cộng, tiền thừa, công nợ
- ✅ Lưu hóa đơn: tự động generate số HD (HD‑YYYY‑XXXXXX), cập nhật công nợ khách hàng

- **Components:**
  - `InvoiceNewPage.tsx`: Trang tạo hóa đơn
  - `ProductSearchAddPanel.tsx`: Search + add to cart

##### 4.3.3. Chi tiết hóa đơn (`/invoices/[id]`)

- ✅ Xem thông tin hóa đơn: số HD, ngày tạo, khách hàng  
- ✅ Xem chi tiết sản phẩm: snapshot tại thời điểm bán (không bị ảnh hưởng khi sửa product)  
- ✅ Xem tổng kết: tạm tính, giảm giá, tổng cộng, đã trả, tiền thừa, công nợ

#### 4.4. Backup & Restore

- **Chức năng:**
  - ✅ Export toàn bộ dữ liệu ra file JSON
  - ✅ Import từ file JSON (validate schema bằng Zod)
  - ✅ Format payload:

```json
{
  "meta": { "version": 1, "exportedAt": "...", "appName": "POS-MVP" },
  "data": {
    "products": [],
    "customers": [],
    "invoices": [],
    "invoiceItems": [],
    "counters": []
  }
}
```

- **Component:**
  - `BackupPanel.tsx`: Nút Export/Import trong Navbar

---

### 5. Nguyên lý hoạt động

#### 5.1. Real-time Updates (Dexie React Hooks)

Sử dụng `useLiveQuery` để tự động cập nhật UI khi DB thay đổi:

```ts
const products = useLiveQuery(async () => {
  return db.products.where('active').equals(1).toArray();
});
```

**Lợi ích:**

- Không cần manual refresh
- Multi-tab sync (nếu mở nhiều tab)
- UI phản ứng theo dữ liệu (reactive)

#### 5.2. Invoice Number Generation

Số hóa đơn format: `HD-YYYY-XXXXXX` (VD: `HD-2025-000001`)

- Lấy năm hiện tại  
- Tạo counter key: `invoice_2025`  
- Tăng `counter.value` lên 1  
- Format: `HD-2025-` + số padded 6 chữ số  
- Lưu trong `db.counters` table

#### 5.3. Debt Management (Quản lý công nợ)

Khi tạo hóa đơn:

- Tính `debtIncrease = max(0, total - paid)`
- Nếu `debtIncrease > 0` → cập nhật `customer.debt += debtIncrease`
- Lưu `invoice.debtIncrease` để tracking

Khi xem khách hàng:

- Hiển thị `customer.debt` (tổng công nợ)
- Badge cảnh báo nếu có công nợ

#### 5.4. Product Snapshots trong Invoice

Khi tạo invoice, lưu snapshot của product vào `InvoiceItem`:

- `productNameSnapshot`
- `categorySnapshot`
- `unitSnapshot`
- `noteSnapshot`
- `unitPrice` (giá tại thời điểm bán)

**Lý do**: Sau này sửa/xóa product, dữ liệu hóa đơn cũ vẫn giữ nguyên.

#### 5.5. Soft Delete

`Product` và `Customer` dùng `active: boolean` thay vì xóa thật:

- `active = true`: Đang hoạt động  
- `active = false`: Đã ngưng/xóa

**Lợi ích:**

- Giữ lại lịch sử  
- Có thể restore  
- Không ảnh hưởng invoice cũ

#### 5.6. Price Tiers (3 mức giá)

Mỗi product có 3 mức giá:

- `price1`: Giá chính (ít nhất một giá phải có)
- `price2`: Giá phụ (optional)
- `price3`: Giá phụ (optional)

Khi tạo invoice:

- Chọn mức giá global (radio buttons)
- Có thể chỉnh giá thủ công (đánh dấu là “Tùy chỉnh” về mặt UI/logic)

---

### 6. UI/UX Patterns

#### 6.1. Layout Structure

```text
┌─────────────────────────────────────┐
│  Sidebar (256px) │  Content Area   │
│                  │                 │
│  - Logo          │  ┌───────────┐ │
│  - Nav Links     │  │  Navbar   │ │
│                  │  └───────────┘ │
│                  │                 │
│                  │  ┌───────────┐ │
│                  │  │  Main     │ │
│                  │  │  Content  │ │
│                  │  └───────────┘ │
└─────────────────────────────────────┘
```

- **Sidebar**: Sticky, scrollable, logo + navigation  
- **Navbar**: Sticky top, hiển thị BIN + user info + logout  
- **Content**: Scrollable, padding responsive

#### 6.2. Styling (TailwindCSS)

- **Color scheme**: Slate (grays) + Blue (primary) + Green (success) + Red (danger) + Amber (warning)
- **Components**: Dùng Tailwind utilities, chỉ `globals.css` cho base styles/shared components
- **Responsive**: Mobile-first, breakpoints `sm`, `md`, `lg`

#### 6.3. Form Patterns

- Modal forms: overlay với backdrop, nội dung cuộn được  
- Inline forms: trong page, có validation errors rõ ràng  
- Keyboard shortcuts:
  - `Ctrl/Cmd + K`: Focus product search
  - `Ctrl/Cmd + Enter`: Save invoice
  - `Esc`: Close modal/clear

---

### 7. Security & Data Integrity

#### 7.1. PIN Security

- **Hashing**: SHA‑256 với salt `pos-mvp-pin-salt-v1`  
- **Storage**: Chỉ lưu hash, không lưu PIN gốc  
- **Validation**: PIN phải 4–6 chữ số

#### 7.2. Transaction Support

Các thao tác quan trọng dùng Dexie transaction:

- Tạo invoice: atomic (`invoice` + `items` + `counter` + `customer.debt`)  
- Import data: atomic (clear all + insert all)

Nếu lỗi giữa chừng, transaction rollback tự động.

#### 7.3. Data Validation

- **Zod schemas**: Validate backup payload, import data  
- **TypeScript**: Type safety cho tất cả models  
- **Runtime checks**: Validate PIN format, BIN format, `price >= 0`, v.v.

---

### 8. Localization

Tất cả text UI nằm trong `shared/i18n/vi.ts`:

- App name, navigation  
- Actions (add, edit, delete, …)  
- Products, Customers, Invoices labels  
- Validation messages, error messages

**Cấu trúc**: object lồng nhau theo domain (`products`, `customers`, `invoices`, …).

---

### 9. Development Workflow

#### 9.1. Scripts

```bash
npm run dev      # Development server (localhost:3000)
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint check
```

#### 9.2. Database Migration

Khi thay đổi schema:

1. Tăng version trong `db/index.ts`
2. Thêm migration logic trong `.upgrade()`
3. Dexie tự động migrate khi user mở app

**Ví dụ**: Version 2 → 3: thêm `users` table.

#### 9.3. Testing

- Unit tests: `utils/auth.test.ts` (PIN hashing, BIN validation)  
- Manual testing: test scenarios trong thư mục `docs/`

---

### 10. Limitations & Future Improvements

#### 10.1. Current Limitations

- Single device: dữ liệu chỉ trên 1 trình duyệt/thiết bị  
- No sync: không có sync giữa các thiết bị  
- No cloud backup: backup phải export file thủ công  
- Single user flow: hỗ trợ 1 tài khoản “Admin” cơ bản, chưa có RBAC đầy đủ

#### 10.2. Potential Improvements

- [ ] Multi-device sync (P2P hoặc cloud)  
- [ ] Cloud backup tự động  
- [ ] Role-based permissions (admin vs cashier)  
- [ ] Reports & analytics (doanh thu, top products, …)  
- [ ] Barcode scanning  
- [ ] Receipt printing  
- [ ] Inventory management (tồn kho)  
- [ ] Multi-currency support

---

### 11. Troubleshooting

#### 11.1. Xem dữ liệu DB

**Chrome DevTools:**

1. Mở DevTools → tab **Application**
2. `Storage → IndexedDB → pos-mvp-db`
3. Mở từng table để xem records

**Console:**

```js
// Import db (nếu được cấu hình cho phép)
const { db } = await import('/db');
await db.products.toArray();
await db.invoices.count();
```

#### 11.2. Clear Data

Xóa toàn bộ dữ liệu cục bộ:

```js
indexedDB.deleteDatabase('pos-mvp-db');
localStorage.clear();
location.reload();
```

#### 11.3. Reset Authentication

```js
// Xóa session
localStorage.removeItem('pos_auth_session');

// Xóa BIN
localStorage.removeItem('pos_device_bin');

location.reload();
```

---

### 12. References

- Next.js Docs: `https://nextjs.org/docs`
- Dexie Docs: `https://dexie.org`
- TailwindCSS Docs: `https://tailwindcss.com/docs`
- React Docs: `https://react.dev`

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-26  
**Author**: POS Development Team
