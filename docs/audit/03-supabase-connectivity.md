# 03 - Supabase Connectivity Analysis

## 🔌 **Supabase Client Configuration**

### Browser Client (`lib/supabase-client.ts`)
```typescript
// ✅ SAFE: Uses only public environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: typeof window !== 'undefined',
    detectSessionInUrl: true
  }
})
```

**Security Status:** ✅ **SAFE** - Only uses public environment variables

### Server Client (`lib/supabase-server.ts`)
```typescript
// ✅ SAFE: Uses service role key (server-only)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    storage: undefined,
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
})
```

**Security Status:** ✅ **SAFE** - Uses service role key, no browser dependencies

## 📊 **Supabase Tables Usage**

### ✅ **Tables Currently Used**

| Table | Usage | Client | Status |
|-------|-------|--------|--------|
| `users` | Authentication, user management | Server | ✅ Active |
| `products` | Product catalog, SKU generation | Server | ✅ Active |
| `app_settings` | Application configuration | Server | ✅ Active |
| `events` | Analytics tracking | Server | ✅ Active |

### 🔄 **Tables Referenced but Not Migrated**

| Table | Current Usage | Target Usage | Migration Status |
|-------|---------------|--------------|------------------|
| `inventory` | SQLite | Supabase | ❌ Pending |
| `orders` | SQLite | Supabase | ❌ Pending |
| `order_items` | SQLite | Supabase | ❌ Pending |
| `printers` | SQLite | Supabase | ❌ Pending |
| `print_jobs` | SQLite | Supabase | ❌ Pending |
| `components` | SQLite | Supabase | ❌ Pending |
| `expenses` | SQLite | Supabase | ❌ Pending |
| `notifications` | SQLite | Supabase | ❌ Pending |
| `bom_entries` | SQLite | Supabase | ❌ Pending |

### 🗑️ **Tables Not Yet Created**
- `finished_goods_inventory` (referenced in SQLite schema)
- `component_inventory` (referenced in SQLite schema)
- `user_notification_preferences` (referenced in SQLite schema)

## 💾 **Storage Usage**

### Buckets Referenced
| Bucket | Purpose | Access | Status |
|--------|---------|--------|--------|
| `product-assets` | Product images, barcodes | Public read, Auth upload | ✅ Active |
| `barcodes` | Barcode images | Public read, Auth upload | ⚠️ Referenced but not created |

### Storage Operations
```typescript
// Barcode generation upload
const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
  .from('product-assets')
  .upload(`barcodes/${productId}.png`, barcodeBuffer, {
    contentType: 'image/png',
    upsert: true
  })
```

### Storage RLS Policies
- **Public Read:** All authenticated users can read images
- **Authenticated Upload:** Admin and Production roles can upload
- **Admin Delete:** Only admin role can delete

## 🔍 **RPCs and Views**

### Global Search Implementation
```typescript
// Current: Direct table queries
const { data: products } = await supabaseAdmin
  .from('products')
  .select('id, product_name, sku, category')
  .or(`product_name.ilike.%${query}%,sku.ilike.%${query}%,category.ilike.%${query}%`)
  .limit(5)
```

### Potential RPCs (Not Implemented)
- `global_search(text)` - Could optimize search performance
- `product_availability(product_id)` - Real-time availability check
- `order_summary(order_id)` - Order with items aggregation

## 🔐 **Authentication Integration**

### Supabase Auth Usage
- **Login:** Custom JWT + bcrypt (not using Supabase Auth)
- **Token Verification:** Custom JWT verification
- **User Management:** Custom user table in Supabase

### Auth Flow
```
1. Login → Custom JWT generation
2. Token Storage → localStorage
3. API Calls → Bearer token in Authorization header
4. Verification → Custom JWT verification + Supabase user lookup
```

### Missing Supabase Auth Features
- **Row Level Security (RLS):** Not fully implemented
- **Real-time Auth:** Not used
- **Social Auth:** Not implemented
- **Password Reset:** Not implemented

## 📈 **Migration Progress**

### ✅ **Completed Migrations**
1. **Authentication Routes**
   - `/api/auth/login` → Supabase users table
   - `/api/auth/verify` → Supabase users table
   - `/api/auth/me` → Supabase users table

2. **Settings Management**
   - `/api/settings` → Supabase app_settings table

3. **Search Functionality**
   - `/api/search` → Supabase products, orders, inventory tables

4. **Product Features**
   - SKU generation → Supabase products table
   - Barcode generation → Supabase products table + Storage

### 🔄 **In Progress**
- **Products CRUD:** Still using SQLite (SKU/Barcode use Supabase)

### ❌ **Pending Migrations**
- **Inventory Management:** Full CRUD operations
- **Orders Management:** Full CRUD operations
- **Printers Management:** Full CRUD operations
- **Print Jobs:** Full CRUD operations
- **Components:** Full CRUD operations
- **Expenses:** Full CRUD operations
- **Notifications:** Full CRUD operations
- **User Management:** Full CRUD operations

## ⚠️ **Security Considerations**

### ✅ **Good Practices**
1. **Service Role Isolation:** Service role key only used server-side
2. **Public Key Safety:** Only public key exposed to browser
3. **SSR Guards:** Proper window/localStorage checks
4. **RLS Preparation:** Storage policies implemented

### ⚠️ **Areas of Concern**
1. **Mixed Authentication:** Custom JWT + Supabase (not using Supabase Auth)
2. **RLS Implementation:** Not fully implemented on tables
3. **Token Management:** Manual JWT handling instead of Supabase Auth
4. **Role Management:** Custom role system instead of Supabase Auth roles

## 🚀 **Recommendations**

### Immediate Actions
1. **Complete Product Migration:** Move remaining CRUD operations to Supabase
2. **Implement RLS:** Add row-level security policies to all tables
3. **Storage Setup:** Create missing `barcodes` bucket
4. **Remove Legacy Routes:** Clean up `/api/local-db/*` routes

### Future Improvements
1. **Migrate to Supabase Auth:** Replace custom JWT with Supabase Auth
2. **Add Real-time Features:** Implement Supabase Realtime subscriptions
3. **Optimize Search:** Create RPC functions for better performance
4. **Add Analytics:** Expand events table usage

## 📋 **Environment Variables Status**

### ✅ **Required Variables**
- `NEXT_PUBLIC_SUPABASE_URL` - ✅ Present
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - ✅ Present
- `SUPABASE_SERVICE_ROLE_KEY` - ✅ Present

### ⚠️ **Missing Variables**
- `SUPABASE_JWT_SECRET` - If migrating to Supabase Auth
- `SUPABASE_REFRESH_TOKEN_SECRET` - If migrating to Supabase Auth
