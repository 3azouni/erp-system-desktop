# 🧪 Pre-Deployment Testing Guide

## 📋 **Overview**

This guide walks you through testing your 3DP Commander application locally before deploying to Vercel and connecting to Supabase.

## 🎯 **Testing Checklist**

### **Phase 1: Local Environment Setup**
- [ ] Environment variables configured
- [ ] Supabase project created
- [ ] Database schema deployed
- [ ] Local development server running
- [ ] Basic functionality working

### **Phase 2: Feature Testing**
- [ ] Authentication system
- [ ] Products CRUD operations
- [ ] SKU generation
- [ ] Barcode generation
- [ ] Global search
- [ ] Role-based access control

### **Phase 3: Supabase Integration**
- [ ] Database connectivity
- [ ] Storage bucket setup
- [ ] RLS policies active
- [ ] Real-time subscriptions (if used)

### **Phase 4: Production Readiness**
- [ ] Build process
- [ ] Environment variable validation
- [ ] Error handling
- [ ] Performance testing

---

## 🔧 **Step 1: Local Environment Setup**

### **1.1 Create Supabase Project**

1. **Go to [supabase.com](https://supabase.com)**
2. **Create New Project**
   - Choose organization
   - Enter project name (e.g., "3dp-commander")
   - Set database password
   - Choose region (closest to your users)
   - Wait for project creation (2-3 minutes)

3. **Get Project Credentials**
   - Go to **Settings** → **API**
   - Copy:
     - Project URL
     - Anon public key
     - Service role key (keep secret!)

### **1.2 Configure Environment Variables**

Create `.env.local` in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Application Environment
NEXT_PUBLIC_APP_ENV=local
APP_TIMEZONE=Asia/Beirut

# JWT Secret (for local development)
JWT_SECRET=your-secret-key-change-in-production
```

### **1.3 Deploy Database Schema**

1. **Open Supabase Dashboard**
2. **Go to SQL Editor**
3. **Run the schema setup script**:

```sql
-- Copy and paste the contents of scripts/supabase-schema-setup.sql
-- This creates all tables, indexes, and triggers
```

4. **Run RLS policies script**:

```sql
-- Copy and paste the contents of scripts/sku-barcode-rls-policies.sql
-- This sets up security policies
```

5. **Run storage setup script**:

```sql
-- Copy and paste the contents of scripts/setup-supabase-storage.sql
-- This creates storage buckets and policies
```

### **1.4 Install Dependencies**

```bash
# Install new dependencies
npm install @supabase/supabase-js canvas qrcode

# Or if using pnpm
pnpm add @supabase/supabase-js canvas qrcode
```

### **1.5 Start Development Server**

```bash
npm run dev
# or
pnpm dev
```

Visit `http://localhost:3000` to verify the app loads.

---

## 🧪 **Step 2: Feature Testing**

### **2.1 Authentication Testing**

1. **Test User Registration/Login**
   - Navigate to `/login`
   - Try logging in with test credentials
   - Verify redirect to dashboard

2. **Test Role-Based Access**
   - Create test users with different roles:
     - `admin`
     - `production`
     - `sales`
     - `inventory`
   - Verify each role has correct permissions

### **2.2 Products Module Testing**

1. **Create Product**
   - Go to Products page
   - Click "Add Product"
   - Fill in required fields
   - Save and verify it appears in the list

2. **SKU Generation Testing**
   - **As Admin/Production User:**
     - Open product form
     - Verify "Generate SKU" button is visible
     - Click "Generate SKU"
     - Verify SKU follows format: `CAT-PRO-MC-###`
     - Verify SKU is saved to database

   - **As Sales/Inventory User:**
     - Verify "Generate SKU" button is NOT visible
     - Verify can read existing SKU data

3. **Barcode Generation Testing**
   - **As Admin/Production User:**
     - Select barcode type (EAN13, CODE128, QR)
     - Click "Generate Barcode"
     - Verify barcode image is created
     - Verify image is uploaded to Supabase Storage
     - Verify barcode URL is saved to product

   - **As Sales/Inventory User:**
     - Verify "Generate Barcode" button is NOT visible
     - Verify can view existing barcode images

### **2.3 Global Search Testing**

1. **Search by Product Name**
   - Use search bar
   - Search for existing product names
   - Verify results are returned

2. **Search by SKU**
   - Search for exact SKU
   - Search for partial SKU
   - Verify SKU appears prominently in results
   - Verify format: `{SKU} • {Category}`

3. **Search Performance**
   - Verify search responds within 2 seconds
   - Verify no errors in browser console

### **2.4 Role-Based Access Control Testing**

1. **Admin User**
   - Can access all features
   - Can generate SKUs and barcodes
   - Can delete products
   - Can access admin-only areas

2. **Production User**
   - Can generate SKUs and barcodes
   - Cannot access admin-only areas
   - Can edit products

3. **Sales User**
   - Can read SKU/barcode data
   - Cannot generate SKUs or barcodes
   - Read-only access to products

4. **Inventory User**
   - Can read SKU/barcode data
   - Cannot generate SKUs or barcodes
   - Read-only access to products

---

## 🔗 **Step 3: Supabase Integration Testing**

### **3.1 Database Connectivity Test**

Create a test script `test-supabase-connection.js`:

```javascript
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Database connection failed:', error)
      return false
    }
    
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Connection test failed:', error)
    return false
  }
}

testConnection()
```

Run the test:

```bash
node test-supabase-connection.js
```

### **3.2 Storage Bucket Testing**

1. **Verify Buckets Exist**
   - Go to Supabase Dashboard → Storage
   - Verify `product-assets` bucket exists
   - Verify `barcodes` folder is accessible

2. **Test File Upload**
   - Generate a barcode in the app
   - Verify file appears in Supabase Storage
   - Verify file is publicly accessible

### **3.3 RLS Policy Testing**

Test RLS policies by switching between different user roles:

```sql
-- Test as different users
-- Check if policies are working correctly
SELECT * FROM products;
```

---

## 🚀 **Step 4: Production Readiness Testing**

### **4.1 Build Testing**

```bash
# Test production build
npm run build

# Check for build errors
# Verify all dependencies are resolved
# Check for TypeScript errors
```

### **4.2 Environment Variable Validation**

Create a validation script `validate-env.js`:

```javascript
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_ENV',
  'APP_TIMEZONE'
]

function validateEnv() {
  const missing = []
  
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  })
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing)
    return false
  }
  
  console.log('✅ All required environment variables are set')
  return true
}

validateEnv()
```

### **4.3 Error Handling Testing**

1. **Test Network Failures**
   - Disconnect internet
   - Try to perform operations
   - Verify graceful error handling

2. **Test Invalid Data**
   - Try to submit forms with invalid data
   - Verify validation errors are shown

3. **Test API Failures**
   - Temporarily break Supabase connection
   - Verify app doesn't crash

### **4.4 Performance Testing**

1. **Page Load Times**
   - Use browser dev tools
   - Check page load times
   - Verify under 3 seconds for main pages

2. **API Response Times**
   - Check network tab
   - Verify API calls complete quickly
   - Check for unnecessary requests

---

## 🔍 **Step 5: Smoke Tests**

Run the comprehensive smoke tests from `SMOKE_TESTS_CHECKLIST.md`:

1. **Environment Check**
   - [ ] All environment variables set
   - [ ] Supabase connection working
   - [ ] Database schema up to date

2. **SSR Check**
   - [ ] No browser APIs in server code
   - [ ] All server actions work
   - [ ] No hydration errors

3. **Authentication & RBAC**
   - [ ] All user roles can log in
   - [ ] Permissions work correctly
   - [ ] UI shows/hides based on role

4. **Products CRUD**
   - [ ] Create, read, update, delete work
   - [ ] SKU generation works
   - [ ] Barcode generation works
   - [ ] Read-only access for restricted roles

5. **Storage Operations**
   - [ ] Barcode images upload successfully
   - [ ] Images are publicly accessible
   - [ ] Cleanup works when products deleted

6. **Global Search**
   - [ ] Search by name works
   - [ ] Search by SKU works
   - [ ] Results display correctly

---

## 🚀 **Step 6: Vercel Deployment Preparation**

### **6.1 Prepare for Deployment**

1. **Commit All Changes**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Verify Build Works**
   ```bash
   npm run build
   # Should complete without errors
   ```

### **6.2 Deploy to Vercel**

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select the repository

2. **Configure Project**
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (or your app directory)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

3. **Set Environment Variables**
   - Go to **Settings** → **Environment Variables**
   - Add all variables from your `.env.local`:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `NEXT_PUBLIC_APP_ENV` = `production`
     - `APP_TIMEZONE` = `Asia/Beirut`
     - `JWT_SECRET` = (your production secret)

4. **Deploy**
   - Click **Deploy**
   - Wait for build to complete
   - Verify deployment URL works

### **6.3 Post-Deployment Testing**

1. **Test Production URL**
   - Visit your Vercel deployment URL
   - Verify app loads correctly
   - Test all major features

2. **Test Environment Variables**
   - Verify `NEXT_PUBLIC_APP_ENV` is set to `production`
   - Test deployment mode features

3. **Test Supabase Connection**
   - Verify database operations work
   - Test storage uploads
   - Verify RLS policies work

4. **Performance Testing**
   - Test page load times
   - Verify API response times
   - Check for any production-specific issues

---

## 🐛 **Common Issues & Solutions**

### **Build Errors**

1. **Canvas Package Issues**
   ```bash
   # If you get canvas build errors
   npm install canvas --build-from-source
   ```

2. **TypeScript Errors**
   ```bash
   # Check for TypeScript issues
   npx tsc --noEmit
   ```

### **Supabase Connection Issues**

1. **CORS Errors**
   - Check Supabase project settings
   - Verify allowed origins include your domain

2. **RLS Policy Issues**
   - Check if policies are enabled
   - Verify user authentication is working

### **Environment Variable Issues**

1. **Missing Variables**
   - Double-check `.env.local` file
   - Verify variable names match exactly

2. **Vercel Environment Variables**
   - Ensure all variables are set in Vercel dashboard
   - Check for typos in variable names

---

## 📊 **Testing Checklist Summary**

### **Before Local Testing**
- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] Dependencies installed

### **Local Testing**
- [ ] Development server starts
- [ ] Authentication works
- [ ] Products CRUD works
- [ ] SKU generation works
- [ ] Barcode generation works
- [ ] Search functionality works
- [ ] RBAC works correctly

### **Before Vercel Deployment**
- [ ] All tests pass locally
- [ ] Build completes successfully
- [ ] Environment variables ready
- [ ] Code committed and pushed

### **After Vercel Deployment**
- [ ] Production URL works
- [ ] All features work in production
- [ ] Performance is acceptable
- [ ] No console errors

---

## 🎯 **Quick Test Commands**

```bash
# Test environment setup
node validate-env.js

# Test Supabase connection
node test-supabase-connection.js

# Test build process
npm run build

# Run smoke tests
# Follow SMOKE_TESTS_CHECKLIST.md

# Start development server
npm run dev
```

**Note**: Always test thoroughly in your local environment before deploying to production. The time spent on testing will save you from issues in production.
