# 🚀 Vercel Deployment Checklist with Supabase

## 📋 **Pre-Deployment Requirements**

### **1. Supabase Setup**
- [ ] **Supabase Project Created**
  - Go to [supabase.com](https://supabase.com)
  - Create new project
  - Note down Project URL and API keys

- [ ] **Database Schema Setup**
  - Run the SQL scripts from `scripts/` folder in Supabase SQL Editor
  - Ensure all tables are created with proper RLS policies

- [ ] **RLS Policies Configured**
  - Check `SUPABASE_RLS_POLICY_MAP.md` for required policies
  - Enable Row Level Security on all tables
  - Test policies with different user roles

### **2. Environment Variables Setup**

#### **Required Environment Variables for Vercel:**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Deployment Configuration
NEXT_PUBLIC_APP_ENV=production

# Optional: Analytics (if using)
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

#### **Vercel Environment Variables Setup:**
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable for **Production** environment
4. Add each variable for **Preview** environment (if needed)

### **3. Code Changes Required**

#### **✅ Already Fixed:**
- [x] Added serverless environment detection in `lib/local-db.ts`
- [x] Updated `vercel.json` configuration
- [x] Added deployment configuration system

#### **🔄 Still Needed:**
- [ ] **API Routes Migration**
  - All API routes currently use `local-db.ts`
  - Need to migrate to use Supabase instead
  - Priority: High - This will cause deployment failures

- [ ] **Database Operations Migration**
  - Replace SQLite operations with Supabase operations
  - Update all database queries to use Supabase client

### **4. Build Configuration**

#### **Next.js Configuration:**
- [x] `next.config.mjs` is properly configured
- [x] TypeScript configuration is correct
- [x] ESLint configuration is set up

#### **Package Dependencies:**
- [ ] **Remove SQLite Dependencies** (for Vercel deployment)
  ```bash
  npm uninstall better-sqlite3 @types/better-sqlite3
  ```
- [ ] **Keep Supabase Dependencies**
  ```bash
  npm install @supabase/supabase-js
  ```

## 🚨 **Critical Issues to Fix**

### **1. API Routes Using Local Database**
**Status:** ❌ **CRITICAL** - Will cause deployment failure

**Files affected:**
- `app/api/auth/login/route.ts`
- `app/api/auth/verify/route.ts`
- `app/api/components/route.ts`
- `app/api/expenses/route.ts`
- `app/api/inventory/route.ts`
- `app/api/notifications/route.ts`
- `app/api/orders/route.ts`
- `app/api/printers/route.ts`
- `app/api/settings/route.ts`
- And many more...

**Solution:**
Replace all `import { getDatabase } from "@/lib/local-db"` with Supabase client usage.

### **2. SQLite Database Operations**
**Status:** ❌ **CRITICAL** - Not compatible with serverless

**Solution:**
- Use Supabase client for all database operations
- Remove SQLite-specific code paths
- Implement proper error handling for serverless environment

### **3. File System Operations**
**Status:** ⚠️ **WARNING** - Limited in serverless

**Solution:**
- Use Supabase Storage for file uploads
- Remove local file system dependencies
- Implement cloud-based file management

## 🔧 **Migration Strategy**

### **Phase 1: Immediate Fixes (Required for Deployment)**
1. **Create Supabase API Routes**
   - Create new API routes that use Supabase
   - Keep existing routes for local development
   - Add environment-based routing

2. **Update Database Operations**
   - Replace SQLite queries with Supabase queries
   - Implement proper error handling
   - Add data validation

3. **Remove SQLite Dependencies**
   - Uninstall `better-sqlite3` for Vercel deployment
   - Add conditional imports based on environment

### **Phase 2: Full Migration (Post-Deployment)**
1. **Complete API Migration**
   - Migrate all API routes to Supabase
   - Remove local database code
   - Implement proper authentication

2. **Data Migration**
   - Export existing data from SQLite
   - Import data to Supabase
   - Verify data integrity

3. **Testing and Validation**
   - Test all functionality in Vercel
   - Validate data operations
   - Performance optimization

## 📝 **Deployment Steps**

### **Step 1: Supabase Setup**
```bash
# 1. Create Supabase project
# 2. Run database setup scripts
# 3. Configure RLS policies
# 4. Test database connectivity
```

### **Step 2: Environment Variables**
```bash
# In Vercel Dashboard:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_ENV=production
```

### **Step 3: Code Migration**
```bash
# 1. Create Supabase-based API routes
# 2. Update database operations
# 3. Remove SQLite dependencies
# 4. Test locally with Supabase
```

### **Step 4: Deploy to Vercel**
```bash
# 1. Push changes to GitHub
# 2. Connect repository to Vercel
# 3. Configure environment variables
# 4. Deploy and test
```

## 🧪 **Testing Checklist**

### **Pre-Deployment Testing:**
- [ ] **Local Testing with Supabase**
  - Test all API routes with Supabase
  - Verify authentication works
  - Test database operations

- [ ] **Environment Variable Testing**
  - Verify all environment variables are set
  - Test Supabase connection
  - Validate deployment configuration

### **Post-Deployment Testing:**
- [ ] **Vercel Deployment Testing**
  - Test all pages load correctly
  - Verify API routes work
  - Test authentication flow

- [ ] **Database Operations Testing**
  - Test CRUD operations
  - Verify RLS policies work
  - Test real-time features

## 🚨 **Emergency Rollback Plan**

If deployment fails:

1. **Immediate Actions:**
   - Revert to previous working commit
   - Disable Vercel deployment temporarily
   - Fix issues locally

2. **Alternative Deployment:**
   - Consider using a different hosting platform
   - Use Docker containerization
   - Deploy to traditional VPS

## 📞 **Support Resources**

- **Supabase Documentation:** https://supabase.com/docs
- **Vercel Documentation:** https://vercel.com/docs
- **Next.js Documentation:** https://nextjs.org/docs
- **Project Issues:** Check GitHub issues for known problems

## ⏰ **Timeline Estimate**

- **Phase 1 (Critical Fixes):** 2-3 days
- **Phase 2 (Full Migration):** 1-2 weeks
- **Testing and Validation:** 3-5 days
- **Total Estimated Time:** 2-3 weeks

## 🎯 **Success Criteria**

- [ ] Application deploys successfully to Vercel
- [ ] All API routes work correctly
- [ ] Authentication system functions properly
- [ ] Database operations work as expected
- [ ] Performance is acceptable
- [ ] No SQLite-related errors in logs
- [ ] All features work in production environment

---

**⚠️ IMPORTANT:** Do not deploy to Vercel until the API routes are migrated to use Supabase instead of SQLite. The current code will cause deployment failures.
