# 🧪 Smoke Tests Checklist

## 📋 **Overview**

This checklist ensures the application works correctly across all deployment environments (local → preview → production) and prevents regressions.

## 🎯 **When to Run**

- **Before every commit** (local)
- **Before preview deployment**
- **Before production deployment**
- **After any environment changes**

---

## 🔧 **Environment Check**

### **Required Environment Variables**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set and valid
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set and valid
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set and valid (server-only)
- [ ] `NEXT_PUBLIC_APP_ENV` is set correctly:
  - [ ] `local` for local development
  - [ ] `preview` for preview deployment
  - [ ] `production` for production deployment
- [ ] `APP_TIMEZONE` is set to `Asia/Beirut`
- [ ] `JWT_SECRET` is set (for local development)

### **Environment Validation**
- [ ] Supabase connection test passes
- [ ] Database schema is up to date
- [ ] RLS policies are active
- [ ] Storage buckets exist (`product-assets`, `barcodes`)

---

## 🖥️ **SSR Check (Server-Side Rendering)**

### **Browser APIs in Server Code**
- [ ] No `window` references in server components
- [ ] No `localStorage` references in server components
- [ ] No `document` references in server components
- [ ] Supabase client uses SSR-safe configuration
- [ ] All server actions work without browser APIs

### **SSR-Safe Components**
- [ ] `lib/supabase-client.ts` has SSR guards
- [ ] `lib/supabase-server.ts` has no browser dependencies
- [ ] All API routes work in server environment
- [ ] No client-side only code in server components

---

## 🔐 **Authentication & RBAC Check**

### **User Login Tests**
- [ ] **Admin User Login**
  - [ ] Can log in with admin credentials
  - [ ] Role is correctly set to `admin`
  - [ ] Has access to all features
  - [ ] Can access admin-only areas

- [ ] **Production User Login**
  - [ ] Can log in with production credentials
  - [ ] Role is correctly set to `production`
  - [ ] Can generate SKUs and barcodes
  - [ ] Cannot access admin-only areas

- [ ] **Sales User Login**
  - [ ] Can log in with sales credentials
  - [ ] Role is correctly set to `sales`
  - [ ] Can read SKU/barcode data
  - [ ] Cannot generate SKUs or barcodes

- [ ] **Inventory User Login**
  - [ ] Can log in with inventory credentials
  - [ ] Role is correctly set to `inventory`
  - [ ] Can read SKU/barcode data
  - [ ] Cannot generate SKUs or barcodes

### **Permission Validation**
- [ ] RLS policies are working correctly
- [ ] API endpoints respect role-based access
- [ ] UI shows/hides features based on role
- [ ] Unauthorized access is properly blocked

---

## 📦 **Products CRUD Operations**

### **Product Creation**
- [ ] Can create a new product
- [ ] All required fields are validated
- [ ] Product is saved to database
- [ ] Product appears in products list

### **SKU Generation**
- [ ] **Admin User**
  - [ ] "Generate SKU" button is visible
  - [ ] Can generate SKU successfully
  - [ ] SKU follows format: `CAT-PRO-MC-###`
  - [ ] SKU is unique (no collisions)
  - [ ] SKU is saved to product record

- [ ] **Production User**
  - [ ] "Generate SKU" button is visible
  - [ ] Can generate SKU successfully
  - [ ] SKU follows correct format
  - [ ] SKU is saved to product record

- [ ] **Sales/Inventory User**
  - [ ] "Generate SKU" button is NOT visible
  - [ ] Cannot access SKU generation API
  - [ ] Can read existing SKU data

### **Barcode Generation**
- [ ] **Admin User**
  - [ ] "Generate Barcode" button is visible
  - [ ] Can generate EAN13 barcode
  - [ ] Can generate CODE128 barcode
  - [ ] Can generate QR code
  - [ ] Barcode image is uploaded to storage
  - [ ] Barcode URL is saved to product
  - [ ] Barcode image is displayed correctly

- [ ] **Production User**
  - [ ] "Generate Barcode" button is visible
  - [ ] Can generate all barcode types
  - [ ] Barcode images are uploaded successfully
  - [ ] Barcode data is saved correctly

- [ ] **Sales/Inventory User**
  - [ ] "Generate Barcode" button is NOT visible
  - [ ] Cannot access barcode generation API
  - [ ] Can view existing barcode images

### **Product Read Operations**
- [ ] All users can view product list
- [ ] Product details are displayed correctly
- [ ] SKU is shown in product table
- [ ] Barcode information is displayed
- [ ] Barcode images are visible (if generated)

### **Product Update Operations**
- [ ] **Admin/Production Users**
  - [ ] Can edit product details
  - [ ] Can update SKU manually
  - [ ] Can update barcode information
  - [ ] Changes are saved correctly

- [ ] **Sales/Inventory Users**
  - [ ] Cannot edit product details
  - [ ] Read-only access to products

### **Product Delete Operations**
- [ ] **Admin User**
  - [ ] Can delete products
  - [ ] Associated barcode images are cleaned up

- [ ] **Other Users**
  - [ ] Cannot delete products

---

## 💾 **Storage Operations**

### **Barcode Image Storage**
- [ ] **Upload Test**
  - [ ] Barcode images are uploaded to `product-assets` bucket
  - [ ] File path follows pattern: `barcodes/{product_id}.png`
  - [ ] Images are stored as PNG format
  - [ ] File size is reasonable (< 1MB)

- [ ] **Read Test**
  - [ ] Barcode images are publicly accessible
  - [ ] Images load correctly in browser
  - [ ] Images display in product table
  - [ ] No broken image links

- [ ] **Cleanup Test**
  - [ ] When product is deleted, barcode image is removed
  - [ ] Orphaned files are cleaned up automatically

### **Storage Permissions**
- [ ] **Admin/Production Users**
  - [ ] Can upload files to storage
  - [ ] Can update existing files
  - [ ] Can delete files

- [ ] **Other Users**
  - [ ] Can read public files
  - [ ] Cannot upload or modify files

---

## 🔍 **Global Search Functionality**

### **Search by Product Name**
- [ ] Search returns products by name
- [ ] Results are displayed correctly
- [ ] Product links work properly

### **Search by SKU**
- [ ] **SKU Search Test**
  - [ ] Search for exact SKU returns product
  - [ ] Search for partial SKU returns product
  - [ ] SKU is displayed prominently in results
  - [ ] SKU format is: `{SKU} • {Category}` (no "SKU:" prefix)

### **Search by Category**
- [ ] Search returns products by category
- [ ] Results are filtered correctly

### **Search Performance**
- [ ] Search responds within 2 seconds
- [ ] No errors in search API
- [ ] Search results are limited to 5 per category

---

## 🚀 **Deployment-Specific Tests**

### **Preview Deployment**
- [ ] **Environment Check**
  - [ ] `NEXT_PUBLIC_APP_ENV` is set to `preview`
  - [ ] Deployment mode is correctly detected

- [ ] **Safety Controls**
  - [ ] Destructive operations are blocked
  - [ ] Service role operations from UI are suppressed
  - [ ] Warning messages are displayed for blocked operations

- [ ] **SKU/Barcode Generation**
  - [ ] SKU generation is blocked (if preview rule is active)
  - [ ] Barcode generation is blocked (if preview rule is active)
  - [ ] Appropriate warning messages are shown

### **Production Deployment**
- [ ] **Environment Check**
  - [ ] `NEXT_PUBLIC_APP_ENV` is set to `production`
  - [ ] All features are enabled

- [ ] **Full Feature Test**
  - [ ] All CRUD operations work
  - [ ] SKU generation works
  - [ ] Barcode generation works
  - [ ] Storage operations work
  - [ ] Search functionality works
  - [ ] RBAC is enforced correctly

- [ ] **Performance Check**
  - [ ] Page load times are acceptable
  - [ ] API responses are fast
  - [ ] No timeout errors

---

## 📊 **Analytics Events**

### **Event Tracking**
- [ ] **Barcode Generation Events**
  - [ ] Events are recorded in `events` table
  - [ ] Event type is `barcode_generated`
  - [ ] User ID is correctly captured
  - [ ] Metadata contains barcode type and value

- [ ] **SKU Generation Events**
  - [ ] Events are recorded in `events` table
  - [ ] Event type is `sku_generated`
  - [ ] User ID is correctly captured
  - [ ] Metadata contains SKU and product info

- [ ] **Event Privacy**
  - [ ] Only admins can read events
  - [ ] Users can only insert their own events
  - [ ] No sensitive data in event metadata

---

## 🐛 **Error Handling**

### **Graceful Degradation**
- [ ] **Analytics Failures**
  - [ ] Analytics errors don't break main functionality
  - [ ] Errors are logged but not shown to users
  - [ ] Main operations complete successfully

- [ ] **Storage Failures**
  - [ ] Storage errors are handled gracefully
  - [ ] User gets appropriate error messages
  - [ ] Application doesn't crash

- [ ] **Database Failures**
  - [ ] Database errors are handled properly
  - [ ] User gets meaningful error messages
  - [ ] Application remains stable

---

## 📱 **Cross-Browser Compatibility**

### **Browser Support**
- [ ] **Chrome/Edge** - All features work
- [ ] **Firefox** - All features work
- [ ] **Safari** - All features work
- [ ] **Mobile browsers** - Responsive design works

### **Responsive Design**
- [ ] **Desktop** - Full functionality
- [ ] **Tablet** - All features accessible
- [ ] **Mobile** - Core features work

---

## 🔄 **Regression Prevention**

### **Before Deployment**
- [ ] All tests pass locally
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Build completes successfully
- [ ] All environment variables are set

### **After Deployment**
- [ ] Smoke tests pass in new environment
- [ ] No new errors introduced
- [ ] Performance is maintained
- [ ] All features work as expected

---

## 📝 **Test Results Template**

```
## Smoke Test Results - [Date] [Environment]

### Environment: [local/preview/production]
### Tester: [Name]
### Duration: [Time taken]

### ✅ Passed Tests
- [List of passed tests]

### ❌ Failed Tests
- [List of failed tests with details]

### ⚠️ Issues Found
- [List of issues that need attention]

### 📊 Summary
- Total Tests: [X]
- Passed: [X]
- Failed: [X]
- Success Rate: [X%]

### 🚀 Deployment Status
- [ ] Ready for deployment
- [ ] Needs fixes before deployment
- [ ] Blocked by critical issues

### 📋 Next Steps
- [List of actions needed]
```

---

## 🎯 **Quick Test Commands**

### **Local Environment**
```bash
# Check environment variables
echo $NEXT_PUBLIC_APP_ENV
echo $APP_TIMEZONE

# Run build test
npm run build

# Start development server
npm run dev
```

### **Database Check**
```sql
-- Check if events table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'events'
);

-- Check recent events
SELECT type, entity, created_at 
FROM events 
ORDER BY created_at DESC 
LIMIT 5;
```

### **Storage Check**
```bash
# Check if storage buckets exist (via Supabase dashboard)
# product-assets bucket should exist
# barcodes folder should be accessible
```

---

**Note**: This checklist should be run systematically for each deployment environment. Any failures should be documented and addressed before proceeding with deployment.
