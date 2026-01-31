# Project Overview & Product Development Requirements (PDR)

**Document Version**: 1.0
**Last Updated**: 2026-01-31
**Status**: Active Development - Phase 1 Complete
**Project Name**: POS Next UI
**Target Platform**: Web (Browser)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Vision](#product-vision)
3. [Functional Requirements](#functional-requirements)
4. [Non-Functional Requirements](#non-functional-requirements)
5. [Technical Constraints](#technical-constraints)
6. [Development Roadmap](#development-roadmap)
7. [Success Metrics](#success-metrics)
8. [Risk Assessment](#risk-assessment)

---

## Executive Summary

**POS Next UI** is a modern, web-based Point-of-Sale (POS) system designed for retail and hospitality businesses. The application provides invoice management, customer tracking, product catalog, and payment processing with a focus on ease-of-use, offline-first capabilities, and data accuracy.

### Key Highlights

- Modern Next.js 16 web application
- PostgreSQL database with Prisma ORM
- PIN-based authentication with role-based access control
- Real-time invoice generation with customer debt tracking
- Offline support via IndexedDB
- Vietnamese language interface
- Production-ready architecture

### Current Phase Status

**Phase 1: Prisma Database Migration** - COMPLETE (as of 2026-01-31)
- Database schema defined with 6 models
- Initial Prisma migration deployed
- PrismaClient configured and tested
- PostgreSQL connection established

### Timeline

| Phase | Name | Duration | Status |
|-------|------|----------|--------|
| 1 | Prisma Database Setup | Complete | ✅ DONE |
| 2 | API Routes & CRUD | 2 weeks | 🔄 IN PROGRESS |
| 3 | Dashboard UI & Components | 3 weeks | 📋 QUEUED |
| 4 | Invoice Management | 3 weeks | 📋 QUEUED |
| 5 | Authentication & Security | 2 weeks | 📋 QUEUED |
| 6 | Testing & QA | 2 weeks | 📋 QUEUED |
| 7 | Deployment & Monitoring | 1 week | 📋 QUEUED |

---

## Product Vision

### Vision Statement

To provide retail and hospitality businesses with a fast, reliable, and user-friendly Point-of-Sale system that simplifies transaction processing, customer management, and inventory tracking while maintaining data accuracy and supporting offline operations.

### Target Users

1. **Primary**: Small to medium-sized retail shops (100-1000 transactions/day)
2. **Secondary**: Hospitality establishments (restaurants, cafes)
3. **Tertiary**: Service businesses requiring invoice management

### Scope

#### In Scope
- User management with PIN-based authentication
- Customer master data and debt tracking
- Product catalog with multi-tier pricing
- Invoice creation with line-item detail
- Payment and change calculation
- Offline transaction support
- Basic reporting (revenue, debt)
- Vietnamese language interface

#### Out of Scope (Phase 1-2)
- Inventory/stock management
- Barcode scanning
- Supplier management
- Advanced reporting/analytics
- Mobile app (web-first only)
- Multi-location support
- Accounting integration
- Employee payroll

---

## Functional Requirements

### FR-1: Authentication & Authorization

#### FR-1.1 PIN-Based Authentication
- Users authenticate using a 4-6 digit PIN
- PIN stored as bcrypt hash
- Failed login attempts logged
- Session timeout after 30 minutes of inactivity

#### FR-1.2 Role-Based Access Control
- Two user roles: Admin, Cashier
- Admins can: Create/edit users, View reports, Manage products
- Cashiers can: Create invoices, Search products, Manage customers
- Enforced at API and UI level

### FR-2: User Management

#### FR-2.1 User CRUD
- Admin can create, read, update, deactivate users
- Each user has: PIN, display name, role, active status
- Users cannot delete themselves
- User list with search by name

#### FR-2.2 User Profile
- Users can change their own PIN
- Display current user information
- Show session info (login time, last activity)

### FR-3: Customer Management

#### FR-3.1 Customer CRUD
- Cashiers can create, read, update customers
- Customer fields: Name, Phone, Address, Notes
- Search customers by name or phone
- Customer history with all invoices

#### FR-3.2 Debt Tracking
- System tracks customer debt (outstanding payments)
- Debt updates when invoice created
- Manual debt adjustment by admin
- Debt reports by customer

#### FR-3.3 Customer List
- List all customers with pagination
- Sort by: Name, Phone, Debt, Creation Date
- Filter by active/inactive status
- Quick actions: View details, Edit, Add invoice

### FR-4: Product Management

#### FR-4.1 Product CRUD
- Admin can create, read, update products
- Product fields: Name, Category, Unit, Prices (1-3 tiers), Notes
- Product status: Active/Inactive
- Category tagging

#### FR-4.2 Product Search
- Real-time search as user types
- Search by: Name, Category
- Display: Name, Unit, Prices, Stock status
- Support case-insensitive matching

#### FR-4.3 Product Listing
- List active products with pagination
- Filter by category
- Display three price tiers
- Sort by: Name, Category, Price

### FR-5: Invoice Management

#### FR-5.1 Invoice Creation
- Create new invoice with date/time auto-set
- Optional customer linkage (counter-sale supported)
- Add multiple line items (products)
- Edit quantities and prices before finalization

#### FR-5.2 Invoice Calculations
- Auto-calculate: Subtotal, Total (with discount), Change
- Support percentage and fixed discounts
- Display running total as items added
- Prevent negative totals

#### FR-5.3 Payment Processing
- Record payment amount and method
- Auto-calculate change
- Support partial payments with debt tracking
- Payment status: Pending, Paid, Overpaid

#### FR-5.4 Invoice Line Items
- Add/remove line items before finalization
- Capture product snapshot: Name, Category, Unit, Price
- Maintain exact quantities with decimal support
- Line-level notes

#### FR-5.5 Invoice History
- View past invoices with search and filter
- Filter by: Date range, Customer, Payment status
- Display invoice details including items
- Reprint invoice functionality
- Void/cancel invoice option

### FR-6: Reporting

#### FR-6.1 Sales Reports
- Daily/weekly/monthly revenue summary
- Revenue by payment method
- Top selling products
- Sales by category

#### FR-6.2 Customer Reports
- Total debt by customer
- Payment history by customer
- Customer lifetime value

#### FR-6.3 Export Functionality
- Export reports as PDF/CSV
- Invoice printing (PDF)

---

## Non-Functional Requirements

### NFR-1: Performance

#### NFR-1.1 Response Times
- API endpoints: < 200ms for 95th percentile
- Page load: < 2s for dashboard
- Search results: < 500ms for 10K products
- Invoice creation: < 1s

#### NFR-1.2 Scalability
- Support 1000+ concurrent users
- Handle 10,000+ daily transactions
- Database queries optimized with indexes
- Pagination for large datasets

#### NFR-1.3 Data Persistence
- Query optimization with strategic indexes
- Connection pooling for database
- Efficient schema design

### NFR-2: Reliability

#### NFR-2.1 Availability
- Target 99.5% uptime
- Graceful degradation for offline mode
- Error recovery without data loss

#### NFR-2.2 Data Integrity
- ACID transactions for invoice creation
- Foreign key constraints
- Unique constraints (invoice numbers)
- Data validation at API level

#### NFR-2.3 Backup & Recovery
- Automatic database backups (daily)
- Point-in-time recovery capability
- Data export for backup

### NFR-3: Security

#### NFR-3.1 Authentication
- Secure PIN hashing with bcrypt
- Session management with JWT/secure cookies
- Password/PIN change functionality
- Account lockout after failed attempts

#### NFR-3.2 Authorization
- Role-based access control
- API endpoint protection
- Data isolation by user context

#### NFR-3.3 Data Protection
- Encryption in transit (HTTPS)
- Sensitive data not logged
- SQL injection prevention via Prisma
- XSS prevention via React sanitization
- CSRF protection via SameSite cookies

#### NFR-3.4 Audit & Compliance
- User action logging (invoice creation, deletions)
- Audit trail for financial transactions
- GDPR compliance for customer data

### NFR-4: Usability

#### NFR-4.1 User Interface
- Responsive design (tablet/desktop)
- Intuitive navigation
- Clear visual hierarchy
- Consistent branding

#### NFR-4.2 Accessibility
- Keyboard navigation support
- Screen reader compatibility
- WCAG 2.1 AA compliance

#### NFR-4.3 Internationalization
- Vietnamese language interface
- Support for currency formatting
- Number formatting (decimal separators)

### NFR-5: Maintainability

#### NFR-5.1 Code Quality
- TypeScript strict mode
- ESLint configuration
- Consistent code style
- Comprehensive documentation

#### NFR-5.2 Testing
- Unit test coverage > 70%
- API integration tests
- Component tests
- E2E tests for critical flows

#### NFR-5.3 Documentation
- API documentation
- Component documentation
- Setup and deployment guides
- Troubleshooting guide

### NFR-6: Offline Functionality

#### NFR-6.1 Offline Support
- Local caching via Dexie (IndexedDB)
- Create invoices offline
- Queue transactions for sync
- Automatic sync when online

#### NFR-6.2 Conflict Resolution
- Handle concurrent modifications
- Last-write-wins for conflicts
- User notification on conflicts

---

## Technical Constraints

### Platform & Stack

| Component | Constraint |
|-----------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript 5 |
| **Backend** | Next.js API Routes |
| **Database** | PostgreSQL 12+, Prisma 7.x |
| **Styling** | Tailwind CSS 4, SASS |
| **Hosting** | Cloud-ready (Vercel preferred) |
| **Browser** | Modern browsers (Chrome, Firefox, Safari, Edge) |

### Database Constraints

1. **Decimal Precision**: Money fields use DECIMAL(12,2) for accuracy
2. **ID Generation**: CUID for distributed systems
3. **Relationships**: Foreign key constraints enforced
4. **Indexes**: Strategic indexes on query paths
5. **Timestamps**: UTC timestamps with timezone support

### API Constraints

1. **Rate Limiting**: 100 req/min per user (future enhancement)
2. **Payload Size**: Max 10MB request body
3. **Timeout**: 30s API timeout
4. **Versioning**: V1 for initial release

### Security Constraints

1. **Password Policy**: PIN must be 4-6 digits
2. **Session**: 30-minute idle timeout
3. **HTTPS**: Required for production
4. **CORS**: Same-origin for SPA

### Performance Constraints

1. **Bundle Size**: < 500KB (initial JS)
2. **Database Query**: < 5s max execution
3. **Index Maintenance**: Automatic
4. **Connection Pool**: 20 concurrent connections

---

## Development Roadmap

### Phase 1: Database Foundation (COMPLETE)
**Status**: ✅ DONE
**Duration**: 1 week

Deliverables:
- Prisma schema with 6 models
- Initial migration created
- PrismaClient configured
- Database connection tested
- .env configuration

### Phase 2: API Routes & CRUD (IN PROGRESS)
**Status**: 🔄 IN PROGRESS
**Estimated**: 2 weeks

Deliverables:
- User CRUD API
- Customer CRUD API
- Product CRUD API
- Invoice CRUD API
- API error handling & validation
- Request/response documentation

### Phase 3: Dashboard UI Components
**Status**: 📋 QUEUED
**Estimated**: 3 weeks

Deliverables:
- Navigation components (Navbar, Sidebar)
- Page layouts
- Form components
- List/table components
- Search interfaces
- Responsive design

### Phase 4: Invoice Management Features
**Status**: 📋 QUEUED
**Estimated**: 3 weeks

Deliverables:
- Invoice creation flow
- Line-item management
- Payment processing
- Invoice history/search
- Invoice detail view
- Print/export functionality

### Phase 5: Authentication & Security
**Status**: 📋 QUEUED
**Estimated**: 2 weeks

Deliverables:
- Login page & flow
- PIN authentication
- Role-based authorization
- Session management
- Protected API routes
- Security headers

### Phase 6: Testing & QA
**Status**: 📋 QUEUED
**Estimated**: 2 weeks

Deliverables:
- Unit tests
- Integration tests
- E2E tests
- Performance testing
- Security audit
- Bug fixes

### Phase 7: Deployment & Monitoring
**Status**: 📋 QUEUED
**Estimated**: 1 week

Deliverables:
- Production build
- Deployment pipeline
- Monitoring & alerts
- Documentation
- User guide
- Go-live support

---

## Success Metrics

### User-Centric Metrics
- User adoption rate: > 80% of cashiers use system daily
- Task completion time: Invoice creation < 2 minutes
- User satisfaction: NPS > 50
- Error recovery time: < 5 minutes

### Business Metrics
- Transaction processing: 1000+ per day
- System uptime: > 99.5%
- Data accuracy: Zero financial discrepancies
- Cost per transaction: < 1% of transaction value

### Technical Metrics
- API response time: < 200ms (p95)
- Database query time: < 100ms (p95)
- Code coverage: > 70% (unit tests)
- Documentation: 100% of public APIs documented

### Quality Metrics
- Critical bugs: 0 in production
- Medium bugs: < 1 per week
- Test pass rate: 100%
- Code review approval: All PRs reviewed

---

## Risk Assessment

### Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Database performance issues | Medium | High | Query optimization, indexing, load testing |
| Data loss during sync | Low | Critical | Transaction safety, backup strategy |
| Authentication bypass | Low | Critical | Security audit, penetration testing |
| Offline sync conflicts | Medium | Medium | Conflict resolution strategy, versioning |
| Integration issues | Medium | Medium | API contract testing, integration tests |
| User adoption slow | Medium | Medium | UX testing, user training, support |

### Critical Risks

#### Risk 1: Financial Data Accuracy
- **Description**: Calculation errors causing revenue discrepancies
- **Probability**: Low (Decimal type prevents floating-point errors)
- **Impact**: Critical (Direct revenue impact)
- **Mitigation**:
  - Use DECIMAL(12,2) for all money fields
  - Comprehensive calculation testing
  - Reconciliation reports
  - Audit logging

#### Risk 2: Data Loss
- **Description**: Invoice data lost due to system failure
- **Probability**: Low
- **Impact**: Critical
- **Mitigation**:
  - ACID transactions for invoice creation
  - Automatic database backups
  - Redundant backup storage
  - Point-in-time recovery testing

#### Risk 3: Offline Sync Issues
- **Description**: Conflicts when syncing offline transactions
- **Probability**: Medium
- **Impact**: High
- **Mitigation**:
  - Last-write-wins conflict resolution
  - Transaction versioning
  - User notification on conflicts
  - Manual reconciliation tools

### Schedule Risks

| Risk | Mitigation |
|------|-----------|
| Phase delays | Weekly status reviews, buffer time |
| Scope creep | Strict requirements, change control |
| Resource constraints | Cross-training, task prioritization |
| Technical blockers | Spike time allocated, expert consultation |

---

## Acceptance Criteria

### Phase 1: Database Foundation
- [ ] All 6 models created in schema
- [ ] Initial migration executes without errors
- [ ] PrismaClient generates successfully
- [ ] Connection to PostgreSQL verified
- [ ] Database normalized and indexed
- [ ] .env.example documented

### Phase 2: API Routes
- [ ] All CRUD endpoints implemented
- [ ] Input validation on all endpoints
- [ ] Error responses consistent
- [ ] API documentation complete
- [ ] Integration tests passing
- [ ] Postman collection created

### Phase 3: Dashboard UI
- [ ] All pages responsive (mobile, tablet, desktop)
- [ ] Navigation working end-to-end
- [ ] Forms validate and submit
- [ ] Loading states display
- [ ] Error messages show
- [ ] Accessibility checked (WCAG)

### Phase 4: Invoice Management
- [ ] Create invoice flow complete
- [ ] Calculations accurate (tested)
- [ ] Payment processing works
- [ ] Offline sync functional
- [ ] Invoice history searchable
- [ ] Print functionality works

### Phase 5: Authentication
- [ ] Login/logout working
- [ ] Session management correct
- [ ] Protected routes enforced
- [ ] Role-based auth verified
- [ ] Pin changes functional
- [ ] Security headers set

### Phase 6: Testing & QA
- [ ] Unit test coverage > 70%
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Performance benchmarks met
- [ ] No critical bugs
- [ ] Security audit passed

### Phase 7: Deployment
- [ ] Build process automated
- [ ] Deployment documented
- [ ] Monitoring alerts configured
- [ ] Documentation complete
- [ ] User training delivered
- [ ] Go-live checklist signed

---

## Dependencies & Prerequisites

### External Dependencies
- PostgreSQL server (production-ready)
- Node.js 18+ runtime
- npm package manager
- Git for version control

### Team Skills Required
- Full-stack TypeScript/React
- Next.js expertise
- Prisma ORM knowledge
- PostgreSQL/SQL
- UI/UX design
- DevOps/deployment

### Prerequisite Tasks
- [ ] Development environment setup
- [ ] PostgreSQL instance provisioned
- [ ] Code repository created
- [ ] CI/CD pipeline configured
- [ ] Design system finalized
- [ ] API contract defined

---

## Conclusion

**POS Next UI** is positioned to become a reliable, user-friendly Point-of-Sale system. The phased approach ensures quality at each stage, with Phase 1 (Database Foundation) successfully completed. The remaining phases follow a logical progression from API infrastructure to user-facing features to quality assurance and deployment.

The project leverages modern technologies (Next.js 16, React 19, TypeScript, Prisma 7) for maintainability and scalability. Clear success metrics and risk mitigation strategies ensure project success and long-term viability.

---

**Document Owner**: Project Manager
**Last Review**: 2026-01-31
**Next Review**: 2026-02-28
**Version Control**: Git
