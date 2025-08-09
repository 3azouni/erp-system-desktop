# 02 - API and Dataflow Analysis

## 📊 **API Routes Map**

### Authentication & User Management
| Route | Method | Purpose | Auth Required | Database |
|-------|--------|---------|---------------|----------|
| `/api/auth/login` | POST | User authentication | No | Supabase |
| `/api/auth/logout` | POST | User logout | Yes | None |
| `/api/auth/verify` | GET | Token verification | Yes | Supabase |
| `/api/auth/me` | GET | Get current user | Yes | Supabase |
| `/api/users` | GET/POST | User CRUD | Yes | SQLite |
| `/api/users/[id]` | PUT/DELETE | User update/delete | Yes | SQLite |

### Products Management
| Route | Method | Purpose | Auth Required | Database |
|-------|--------|---------|---------------|----------|
| `/api/products` | GET/POST | Product CRUD | Yes | SQLite |
| `/api/products/[id]` | GET/PUT/DELETE | Product operations | Yes | SQLite |
| `/api/products/generate-sku` | POST | Auto SKU generation | Yes | Supabase |
| `/api/products/generate-barcode` | POST | Barcode generation | Yes | Supabase |
| `/api/products/availability` | POST | Check availability | Yes | SQLite |

### Inventory Management
| Route | Method | Purpose | Auth Required | Database |
|-------|--------|---------|---------------|----------|
| `/api/inventory` | GET/POST | Inventory CRUD | Yes | SQLite |
| `/api/inventory/[id]` | PUT/DELETE | Inventory operations | Yes | SQLite |

### Orders Management
| Route | Method | Purpose | Auth Required | Database |
|-------|--------|---------|---------------|----------|
| `/api/orders` | GET/POST | Order CRUD | Yes | SQLite |
| `/api/orders/[id]` | GET/PUT/DELETE | Order operations | Yes | SQLite |

### Printers Management
| Route | Method | Purpose | Auth Required | Database |
|-------|--------|---------|---------------|----------|
| `/api/printers` | GET/POST | Printer CRUD | Yes | SQLite |
| `/api/printers/[id]` | PUT/DELETE | Printer operations | Yes | SQLite |

### Print Jobs & Scheduling
| Route | Method | Purpose | Auth Required | Database |
|-------|--------|---------|---------------|----------|
| `/api/print-jobs` | GET/POST | Print job CRUD | Yes | SQLite |
| `/api/print-jobs/[id]` | PUT/DELETE | Print job operations | Yes | SQLite |
| `/api/print-jobs/monitor` | POST | Job monitoring | Yes | SQLite |

### Components Management
| Route | Method | Purpose | Auth Required | Database |
|-------|--------|---------|---------------|----------|
| `/api/components` | GET/POST | Component CRUD | Yes | SQLite |
| `/api/components/[id]` | GET/PUT/DELETE | Component operations | Yes | SQLite |
| `/api/components/[id]/use` | POST | Component usage tracking | Yes | SQLite |

### Expenses Management
| Route | Method | Purpose | Auth Required | Database |
|-------|--------|---------|---------------|----------|
| `/api/expenses` | GET/POST | Expense CRUD | Yes | SQLite |
| `/api/expenses/[id]` | PUT/DELETE | Expense operations | Yes | SQLite |

### Settings & Configuration
| Route | Method | Purpose | Auth Required | Database |
|-------|--------|---------|---------------|----------|
| `/api/settings` | GET/PUT | App settings | Yes | Supabase |

### Notifications
| Route | Method | Purpose | Auth Required | Database |
|-------|--------|---------|---------------|----------|
| `/api/notifications` | GET/POST | Notification CRUD | Yes | SQLite |
| `/api/notifications/[id]/read` | PUT | Mark as read | Yes | SQLite |
| `/api/notifications/clear` | DELETE | Clear notifications | Yes | SQLite |

### Profile Management
| Route | Method | Purpose | Auth Required | Database |
|-------|--------|---------|---------------|----------|
| `/api/profile` | GET/PUT | Profile CRUD | Yes | SQLite |
| `/api/profile/notifications` | GET/PUT | Notification preferences | Yes | SQLite |
| `/api/profile/password` | PUT | Password change | Yes | SQLite |

### Utilities
| Route | Method | Purpose | Auth Required | Database |
|-------|--------|---------|---------------|----------|
| `/api/search` | GET | Global search | No | Supabase |
| `/api/export` | POST | Data export | Yes | SQLite |
| `/api/production` | POST | Production tracking | Yes | SQLite |
| `/api/maintenance/notifications` | POST | Maintenance alerts | Yes | SQLite |

### Legacy Local DB (Deprecated)
| Route | Method | Purpose | Auth Required | Database |
|-------|--------|---------|---------------|----------|
| `/api/local-db/init` | POST | Initialize SQLite | No | SQLite |
| `/api/local-db/migrate` | POST | Migrate data | No | SQLite |
| `/api/local-db/sample-data` | POST | Insert sample data | No | SQLite |
| `/api/local-db/status` | GET | Check DB status | No | SQLite |

## 🔄 **Data Flow Analysis**

### Products Feature
```
Frontend → API → Database
├── List: GET /api/products → SQLite (legacy)
├── Create: POST /api/products → SQLite (legacy)
├── Update: PUT /api/products/[id] → SQLite (legacy)
├── Delete: DELETE /api/products/[id] → SQLite (legacy)
├── SKU Gen: POST /api/products/generate-sku → Supabase ✅
├── Barcode Gen: POST /api/products/generate-barcode → Supabase ✅
└── Availability: POST /api/products/availability → SQLite (legacy)
```

### Authentication Flow
```
Login: POST /api/auth/login → Supabase ✅
Verify: GET /api/auth/verify → Supabase ✅
Profile: GET /api/auth/me → Supabase ✅
Logout: POST /api/auth/logout → Local storage cleanup
```

### Settings Management
```
Load: GET /api/settings → Supabase ✅
Save: PUT /api/settings → Supabase ✅
```

### Search Functionality
```
Global Search: GET /api/search → Supabase ✅
```

## 📈 **Migration Status by Feature**

### ✅ **Fully Migrated to Supabase**
- Authentication (login, verify, me)
- Settings management
- Global search
- SKU generation
- Barcode generation

### 🔄 **Partially Migrated**
- Products (CRUD still SQLite, SKU/Barcode Supabase)

### ❌ **Still Using SQLite**
- Inventory management
- Orders management
- Printers management
- Print jobs & scheduling
- Components management
- Expenses management
- Notifications
- Profile management
- User management
- Export functionality
- Production tracking
- Maintenance notifications

### 🗑️ **Legacy Routes (Should be Removed)**
- All `/api/local-db/*` routes

## 🔍 **Data Fetching Patterns**

### Server-Side Data Fetching
- **Settings:** Server-side in `settings-context.tsx`
- **User Profile:** Server-side in `auth-context.tsx`
- **Search:** Server-side in search components

### Client-Side Data Fetching
- **Products:** Client-side with useEffect
- **Inventory:** Client-side with useEffect
- **Orders:** Client-side with useEffect
- **Printers:** Client-side with useEffect
- **Components:** Client-side with useEffect
- **Expenses:** Client-side with useEffect

### Revalidation Patterns
- **Current:** Manual page refreshes
- **Missing:** SWR or React Query integration
- **Gaps:** No automatic revalidation after mutations

## ⚠️ **Data Synchronization Issues**

### Stale Data Risks
1. **Products:** No revalidation after SKU/Barcode generation
2. **Inventory:** No real-time updates for stock changes
3. **Orders:** No real-time status updates
4. **Print Jobs:** No real-time monitoring updates
5. **Notifications:** No real-time delivery

### Missing Revalidation
- Product list after SKU generation
- Product list after barcode generation
- Inventory after stock changes
- Orders after status updates
- Print jobs after status changes

### Recommended Fixes
1. **Add SWR/React Query** for client-side caching
2. **Implement revalidation** after mutations
3. **Add real-time subscriptions** for critical data
4. **Use Next.js revalidate** for server-side data

## 🔐 **Authentication Requirements**

### Public Routes
- `/api/auth/login`
- `/api/search`
- `/api/local-db/*` (legacy)

### Protected Routes
- All other API routes require Bearer token
- Token verification via `verifyToken()` function
- Role-based access control for SKU/Barcode generation

### Role Requirements
- **SKU Generation:** Admin or Production role
- **Barcode Generation:** Admin or Production role
- **Settings Management:** Admin role
- **User Management:** Admin role
- **All Other Operations:** Authenticated users
