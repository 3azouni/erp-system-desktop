# 🔐 How to Call Supabase (Browser vs Server)

## 📋 Overview

This project uses **two separate Supabase clients** to ensure SSR safety and proper RLS handling:

- **Browser Client** (`lib/supabase-client.ts`) - For client-side operations
- **Server Client** (`lib/supabase-server.ts`) - For server-side operations

## 🖥️ Browser Client Usage

### Import
```typescript
import { supabase, isBrowser, getLocalStorage, setLocalStorage, removeLocalStorage } from '@/lib/supabase-client'
```

### When to Use
- ✅ **Client Components** (`"use client"`)
- ✅ **User authentication** (login, logout, session management)
- ✅ **Real-time subscriptions**
- ✅ **Client-side data fetching** (with RLS)
- ✅ **Form submissions** from client

### Examples

#### Authentication
```typescript
// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Logout
const { error } = await supabase.auth.signOut()

// Get current session
const { data: { session } } = await supabase.auth.getSession()
```

#### Data Operations (with RLS)
```typescript
// Get products (respects RLS policies)
const { data, error } = await supabase
  .from('products')
  .select('*')
  .order('created_at', { ascending: false })

// Create product (user must have permission)
const { data, error } = await supabase
  .from('products')
  .insert({
    product_name: 'New Product',
    sku: 'SKU123',
    category: 'Electronics'
  })
  .select()
```

#### Real-time Subscriptions
```typescript
// Subscribe to changes
const subscription = supabase
  .channel('products')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'products' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
```

## 🖥️ Server Client Usage

### Import
```typescript
import { supabaseAdmin, serverDb, isServer } from '@/lib/supabase-server'
```

### When to Use
- ✅ **API Routes** (`app/api/*/route.ts`)
- ✅ **Server Components** (no "use client")
- ✅ **Server Actions** (`"use server"`)
- ✅ **getServerSideProps** (if using Pages Router)
- ✅ **Admin operations** (bypasses RLS)
- ✅ **Background jobs**

### Examples

#### API Route Example
```typescript
// app/api/products/route.ts
import { serverDb } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const products = await serverDb.getProducts()
    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const productData = await request.json()
    const product = await serverDb.createProduct(productData)
    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

#### Server Component Example
```typescript
// app/products/page.tsx (Server Component)
import { serverDb } from '@/lib/supabase-server'
import ProductList from '@/components/ProductList'

export default async function ProductsPage() {
  // This runs on the server - safe to use serverDb
  const products = await serverDb.getProducts()
  
  return (
    <div>
      <h1>Products</h1>
      <ProductList products={products} />
    </div>
  )
}
```

#### Server Action Example
```typescript
// app/actions/product-actions.ts
"use server"

import { serverDb } from '@/lib/supabase-server'

export async function createProduct(formData: FormData) {
  const productData = {
    product_name: formData.get('product_name') as string,
    sku: formData.get('sku') as string,
    category: formData.get('category') as string
  }
  
  try {
    const product = await serverDb.createProduct(productData)
    return { success: true, data: product }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
```

## 🔒 Security & RLS

### Row Level Security (RLS)
- **Browser Client**: Respects RLS policies based on user session
- **Server Client**: Bypasses RLS using service role (admin access)

### Environment Variables
```bash
# Browser-safe (NEXT_PUBLIC_*)
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Server-only (not exposed to browser)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🚨 Common Mistakes to Avoid

### ❌ Don't Use Browser Client in Server Code
```typescript
// WRONG - This will crash on server
import { supabase } from '@/lib/supabase-client'

export default async function ServerComponent() {
  const { data } = await supabase.from('products').select('*') // ❌ Crashes
  return <div>{data}</div>
}
```

### ❌ Don't Use Server Client in Browser Code
```typescript
// WRONG - Service role key exposed to browser
import { supabaseAdmin } from '@/lib/supabase-server'

export default function ClientComponent() {
  const handleClick = async () => {
    const { data } = await supabaseAdmin.from('products').select('*') // ❌ Security risk
  }
  return <button onClick={handleClick}>Load Data</button>
}
```

### ✅ Correct Pattern
```typescript
// Server Component
import { serverDb } from '@/lib/supabase-server'

export default async function ServerComponent() {
  const products = await serverDb.getProducts() // ✅ Safe
  return <ProductList products={products} />
}

// Client Component
"use client"
import { supabase } from '@/lib/supabase-client'

export default function ClientComponent() {
  const handleClick = async () => {
    const { data } = await supabase.from('products').select('*') // ✅ Safe
  }
  return <button onClick={handleClick}>Load Data</button>
}
```

## 🔄 Migration from SQLite

When migrating existing code from SQLite to Supabase:

1. **Replace imports**:
   ```typescript
   // OLD
   import { getDatabase } from '@/lib/local-db'
   
   // NEW (Server)
   import { serverDb } from '@/lib/supabase-server'
   
   // NEW (Client)
   import { supabase } from '@/lib/supabase-client'
   ```

2. **Replace database calls**:
   ```typescript
   // OLD SQLite
   const database = getDatabase()
   database.get('SELECT * FROM products WHERE id = ?', [id])
   
   // NEW Supabase (Server)
   const product = await serverDb.getProductById(id)
   
   // NEW Supabase (Client)
   const { data } = await supabase.from('products').select('*').eq('id', id).single()
   ```

## 📚 Additional Resources

- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
