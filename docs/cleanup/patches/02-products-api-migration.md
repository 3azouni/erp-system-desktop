# Patch 02: Products API Migration to Supabase

## 🚨 **Critical Issue Fixed**
Products API routes were still using SQLite, causing database connectivity issues in production.

## 📋 **Files Modified**

### 1. **Products API Routes**
- `app/api/products/route.ts` - Migrated GET and POST to Supabase
- `app/api/products/[id]/route.ts` - Migrated GET, PUT, DELETE to Supabase

## 🔧 **Changes Made**

### **Database Import Changes**
```typescript
// Before: SQLite
import { getDatabase } from "@/lib/local-db"

// After: Supabase
import { supabaseAdmin } from "@/lib/supabase-server"
```

### **GET Products (List)**
```typescript
// Before: SQLite with manual JSON parsing
const products = await new Promise<any[]>((resolve, reject) => {
  database.all('SELECT * FROM products ORDER BY created_at DESC', (err, rows) => {
    if (err) reject(err)
    else resolve(rows || [])
  })
})

// After: Supabase with native JSONB support
const { data: products, error } = await supabaseAdmin
  .from('products')
  .select('*')
  .order('created_at', { ascending: false })
```

### **POST Product (Create)**
```typescript
// Before: SQLite with manual JSON stringification
const materialsToSave = JSON.stringify(materialsArray)
database.run(
  `INSERT INTO products (...) VALUES (...)`,
  [product_name, sku, category, ..., materialsToSave, ...]
)

// After: Supabase with native JSONB
const { data: product, error } = await supabaseAdmin
  .from('products')
  .insert({
    product_name,
    sku,
    category,
    required_materials: materialsArray, // Native JSONB
    // ... other fields
  })
  .select()
  .single()
```

### **PUT Product (Update)**
```typescript
// Before: SQLite with manual JSON handling
database.run(
  `UPDATE products SET ... WHERE id = ?`,
  [product_name, sku, ..., materialsToSave, ..., params.id]
)

// After: Supabase with native JSONB
const { data: product, error } = await supabaseAdmin
  .from('products')
  .update({
    product_name,
    sku,
    required_materials: materialsArray, // Native JSONB
    // ... other fields
  })
  .eq('id', params.id)
  .select()
  .single()
```

### **DELETE Product**
```typescript
// Before: SQLQLite
await new Promise<void>((resolve, reject) => {
  database.run('DELETE FROM products WHERE id = ?', [params.id], (err) => {
    if (err) reject(err)
    else resolve()
  })
})

// After: Supabase
const { error } = await supabaseAdmin
  .from('products')
  .delete()
  .eq('id', params.id)
```

## ✅ **Benefits**
1. **Consistent Database** - All products operations now use Supabase
2. **Better JSON Handling** - Native JSONB support eliminates parsing issues
3. **Improved Performance** - Supabase queries are more efficient
4. **Better Error Handling** - Consistent error responses
5. **Future-Proof** - Ready for RLS and real-time features

## 🧪 **Testing Required**
- [ ] Test product listing (GET /api/products)
- [ ] Test product creation (POST /api/products)
- [ ] Test product update (PUT /api/products/[id])
- [ ] Test product deletion (DELETE /api/products/[id])
- [ ] Verify required_materials array handling
- [ ] Test with existing product data
- [ ] Verify SKU and barcode generation still works

## 📝 **Next Steps**
This patch completes the products API migration. Additional API routes that need migration:
- Inventory management (`/api/inventory`)
- Orders management (`/api/orders`)
- Printers management (`/api/printers`)
- Print jobs (`/api/print-jobs`)
- Components (`/api/components`)
- Expenses (`/api/expenses`)

## 🔄 **Rollback Plan**
If issues arise, revert to SQLite by:
1. Restoring `import { getDatabase } from "@/lib/local-db"`
2. Replacing Supabase queries with SQLite database calls
3. Restoring manual JSON stringification for required_materials
4. Testing with local SQLite database