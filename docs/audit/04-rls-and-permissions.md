# 04 - RLS and Permissions Analysis

## 🔐 **Role-Based Access Control (RBAC)**

### User Roles Defined
| Role | Description | Permissions |
|------|-------------|-------------|
| `admin` | System Administrator | Full access to all features |
| `production` | Production Manager | Product management, SKU/Barcode generation |
| `sales` | Sales Representative | Read access to products, orders |
| `inventory` | Inventory Manager | Inventory management, read access |
| `viewer` | Read-only User | Limited read access |

### Role Assignment
```typescript
// User roles are stored in Supabase users table
interface User {
  id: string
  email: string
  role: 'admin' | 'production' | 'sales' | 'inventory' | 'viewer'
  department: string
  // ... other fields
}
```

## 🛡️ **Row Level Security (RLS) Status**

### Current RLS Implementation

#### ✅ **Storage RLS (Implemented)**
```sql
-- Product assets bucket policies
CREATE POLICY "All roles can read product assets" ON storage.objects 
FOR SELECT USING (bucket_id = 'product-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Admin and Production can upload product assets" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'product-assets' AND 
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'production')));

CREATE POLICY "Admin can delete product assets" ON storage.objects 
FOR DELETE USING (bucket_id = 'product-assets' AND 
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'));
```

#### ❌ **Table RLS (Not Implemented)**
- **users table:** No RLS policies found
- **products table:** No RLS policies found
- **app_settings table:** No RLS policies found
- **events table:** No RLS policies found
- **All other tables:** Not yet migrated to Supabase

### RLS Policy Requirements

#### Users Table
```sql
-- Recommended RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON users 
FOR SELECT USING (id::text = auth.uid()::text);

-- Admins can read all users
CREATE POLICY "Admins can read all users" ON users 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);

-- Admins can manage all users
CREATE POLICY "Admins can manage users" ON users 
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);
```

#### Products Table
```sql
-- Recommended RLS policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read products
CREATE POLICY "Authenticated users can read products" ON products 
FOR SELECT USING (auth.role() = 'authenticated');

-- Admin and Production can create/update products
CREATE POLICY "Admin and Production can manage products" ON products 
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'production'))
);
```

## 🔑 **Permission Matrix**

### SKU/Barcode Generation Permissions

#### Current Implementation
```typescript
// API Route Level Check
const { data: userData } = await supabaseAdmin
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single()

if (!['admin', 'production'].includes(userData.role)) {
  return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
}
```

#### UI Level Check
```typescript
// Component Level Check
{userRole && ['admin', 'production'].includes(userRole) ? (
  <Button onClick={generateSKU}>Generate SKU</Button>
) : (
  <div>SKU generation requires admin or production role</div>
)}
```

### Feature Permission Matrix

| Feature | Admin | Production | Sales | Inventory | Viewer |
|---------|-------|------------|-------|-----------|--------|
| **User Management** | ✅ Full | ❌ None | ❌ None | ❌ None | ❌ None |
| **Product CRUD** | ✅ Full | ✅ Full | ❌ None | ❌ None | ❌ None |
| **SKU Generation** | ✅ Full | ✅ Full | ❌ None | ❌ None | ❌ None |
| **Barcode Generation** | ✅ Full | ✅ Full | ❌ None | ❌ None | ❌ None |
| **Inventory Management** | ✅ Full | ❌ None | ❌ None | ✅ Full | ❌ None |
| **Order Management** | ✅ Full | ❌ None | ✅ Full | ❌ None | ❌ None |
| **Printer Management** | ✅ Full | ❌ None | ❌ None | ❌ None | ❌ None |
| **Settings Management** | ✅ Full | ❌ None | ❌ None | ❌ None | ❌ None |
| **Analytics** | ✅ Full | ✅ Read | ✅ Read | ✅ Read | ✅ Read |

## ⚠️ **Permission Gaps and Issues**

### 1. **Missing RLS Implementation**
- **Risk:** High - No database-level security
- **Impact:** Users could potentially access unauthorized data
- **Status:** Critical - Needs immediate attention

### 2. **Inconsistent Permission Checks**
- **Issue:** Some routes check permissions, others don't
- **Example:** `/api/users` checks admin role, but `/api/products` doesn't
- **Risk:** Medium - Potential unauthorized access

### 3. **Role Validation Gaps**
- **Issue:** Role validation only happens in some API routes
- **Missing:** Inventory, Orders, Printers, Components routes
- **Risk:** Medium - Inconsistent security

### 4. **Frontend-Only Permission Checks**
- **Issue:** Some permissions only checked in UI, not API
- **Risk:** High - Can be bypassed by direct API calls

## 🔍 **Current Permission Implementation**

### API Route Permissions

#### ✅ **Properly Implemented**
```typescript
// /api/users/route.ts
if (decoded.role !== "admin") {
  return NextResponse.json({ error: "Admin access required" }, { status: 403 })
}

// /api/products/generate-sku/route.ts
if (!['admin', 'production'].includes(userData.role)) {
  return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
}
```

#### ❌ **Missing Permissions**
- `/api/products` - No role checks
- `/api/inventory` - No role checks
- `/api/orders` - No role checks
- `/api/printers` - No role checks
- `/api/components` - No role checks
- `/api/expenses` - No role checks

### UI Component Permissions

#### ✅ **Properly Implemented**
```typescript
// product-form-modal.tsx
{userRole && ['admin', 'production'].includes(userRole) ? (
  <Button onClick={generateSKU}>Generate SKU</Button>
) : (
  <div>SKU generation requires admin or production role</div>
)}
```

#### ❌ **Missing UI Permissions**
- Most forms don't check user roles
- Delete buttons available to all users
- Settings access not restricted

## 🚀 **Recommended Actions**

### Immediate (High Priority)
1. **Enable RLS on all Supabase tables**
2. **Add role checks to all API routes**
3. **Implement consistent permission validation**
4. **Add UI-level permission checks**

### Short Term (Medium Priority)
1. **Create comprehensive RLS policies**
2. **Add role-based UI rendering**
3. **Implement permission middleware**
4. **Add audit logging for permission checks**

### Long Term (Low Priority)
1. **Migrate to Supabase Auth roles**
2. **Implement fine-grained permissions**
3. **Add permission inheritance**
4. **Create permission management UI**

## 📋 **Permission Checklist**

### Database Level
- [ ] Enable RLS on users table
- [ ] Enable RLS on products table
- [ ] Enable RLS on app_settings table
- [ ] Enable RLS on events table
- [ ] Create RLS policies for each table
- [ ] Test RLS policies with different roles

### API Level
- [ ] Add role checks to all API routes
- [ ] Implement consistent permission validation
- [ ] Add permission middleware
- [ ] Test API permissions with different roles

### UI Level
- [ ] Add role-based component rendering
- [ ] Hide unauthorized features
- [ ] Add permission indicators
- [ ] Test UI permissions with different roles

### Security Level
- [ ] Audit all permission checks
- [ ] Test permission bypass scenarios
- [ ] Add security logging
- [ ] Document permission matrix
