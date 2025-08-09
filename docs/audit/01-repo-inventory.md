# 01 - Repository Inventory

## 📋 **Project Overview**

**Project Name:** 3DP Commander  
**Framework:** Next.js 14.2.16 (App Router)  
**Language:** TypeScript  
**Styling:** Tailwind CSS + shadcn/ui  
**UI Components:** Radix UI  
**Backend:** Supabase (PostgreSQL + Auth + Storage)  
**Deployment:** Vercel  

## 🔧 **Configuration Summary**

### Next.js Configuration (`next.config.mjs`)
- **Framework:** Next.js 14.2.16
- **Image Optimization:** `unoptimized: false` (enabled)
- **External Packages:** `['bcryptjs', 'canvas']` (server components)
- **Build Output:** Standard Next.js build process

### TypeScript Configuration (`tsconfig.json`)
- **Target:** ES2017
- **Module:** ESNext
- **JSX:** React JSX
- **Strict Mode:** Enabled
- **Path Mapping:** Configured for `@/` → `./` imports

### Tailwind Configuration (`tailwind.config.ts`)
- **Content Sources:** `app/**/*.{js,ts,jsx,tsx,mdx}`, `components/**/*.{js,ts,jsx,tsx,mdx}`
- **Theme Extensions:** Custom colors, spacing, animations
- **Plugins:** `tailwindcss-animate`
- **shadcn/ui Integration:** Fully configured

## 📁 **App Router Structure**

### Pages/Routes Map
```
app/
├── analytics/
│   ├── loading.tsx
│   └── page.tsx
├── api/
│   ├── auth/
│   │   ├── login/route.ts
│   │   ├── logout/route.ts
│   │   ├── verify/route.ts
│   │   └── me/route.ts
│   ├── components/
│   │   ├── [id]/route.ts
│   │   ├── [id]/use/route.ts
│   │   └── route.ts
│   ├── expenses/
│   │   ├── [id]/route.ts
│   │   └── route.ts
│   ├── export/route.ts
│   ├── inventory/
│   │   ├── [id]/route.ts
│   │   └── route.ts
│   ├── local-db/
│   │   ├── init/route.ts
│   │   ├── migrate/route.ts
│   │   ├── sample-data/route.ts
│   │   └── status/route.ts
│   ├── maintenance/notifications/route.ts
│   ├── notifications/
│   │   ├── [id]/read/route.ts
│   │   ├── clear/route.ts
│   │   └── route.ts
│   ├── orders/
│   │   ├── [id]/route.ts
│   │   └── route.ts
│   ├── print-jobs/
│   │   ├── [id]/route.ts
│   │   ├── monitor/route.ts
│   │   └── route.ts
│   ├── printers/
│   │   ├── [id]/route.ts
│   │   └── route.ts
│   ├── products/
│   │   ├── [id]/route.ts
│   │   ├── availability/route.ts
│   │   ├── generate-barcode/route.ts
│   │   ├── generate-sku/route.ts
│   │   └── route.ts
│   ├── profile/
│   │   ├── notifications/route.ts
│   │   ├── password/route.ts
│   │   └── route.ts
│   ├── search/route.ts
│   ├── settings/route.ts
│   └── users/
│       ├── [id]/route.ts
│       └── route.ts
├── bom/page.tsx
├── components/page.tsx
├── expenses/page.tsx
├── globals.css
├── inventory/page.tsx
├── layout.tsx
├── loading.tsx
├── login/page.tsx
├── orders/page.tsx
├── page.tsx
├── printers/page.tsx
├── products/page.tsx
├── profile/page.tsx
├── scheduler/page.tsx
├── settings/page.tsx
└── test/page.tsx
```

### API Routes Summary
- **Authentication:** 4 routes (login, logout, verify, me)
- **Products:** 5 routes (CRUD + SKU/Barcode generation + availability)
- **Inventory:** 2 routes (CRUD)
- **Orders:** 2 routes (CRUD)
- **Printers:** 2 routes (CRUD)
- **Print Jobs:** 3 routes (CRUD + monitoring)
- **Components:** 3 routes (CRUD + usage tracking)
- **Expenses:** 2 routes (CRUD)
- **Settings:** 1 route (GET/PUT)
- **Users:** 2 routes (CRUD)
- **Profile:** 3 routes (notifications, password, general)
- **Notifications:** 3 routes (CRUD + read status + clear)
- **Search:** 1 route (global search)
- **Export:** 1 route (data export)
- **Maintenance:** 1 route (notifications)
- **Local DB:** 4 routes (legacy SQLite operations)

### Server Actions
- **SKU Generation:** `/api/products/generate-sku`
- **Barcode Generation:** `/api/products/generate-barcode`
- **Product Availability:** `/api/products/availability`
- **Print Job Monitoring:** `/api/print-jobs/monitor`
- **Component Usage:** `/api/components/[id]/use`

## 🏗️ **Build/Runtime Configuration**

### Node.js Runtime Usage
- **Server Components:** All API routes use Node.js runtime
- **External Packages:** `bcryptjs`, `canvas` require Node.js
- **Database Operations:** Supabase client operations
- **File System:** No direct file system access in API routes

### Edge Runtime Considerations
- **Current Usage:** None (all routes use Node.js)
- **Potential Migration:** Search API could use Edge runtime
- **Limitations:** Canvas operations require Node.js

## 📊 **Technology Stack Summary**

### Frontend
- **Framework:** Next.js 14.2.16 (App Router)
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 3.4.17
- **UI Library:** shadcn/ui + Radix UI
- **State Management:** React Context (Auth, Settings)
- **Forms:** React Hook Form + Zod validation

### Backend
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth + JWT
- **Storage:** Supabase Storage
- **Real-time:** Supabase Realtime (potential)
- **API:** Next.js API Routes

### Development Tools
- **Package Manager:** npm
- **Linting:** ESLint + Next.js config
- **Type Checking:** TypeScript strict mode
- **Build Tool:** Next.js built-in
- **Deployment:** Vercel

## 🔍 **Key Findings**

### ✅ **Strengths**
- Modern Next.js 14 with App Router
- Comprehensive TypeScript coverage
- Well-structured API routes
- Proper shadcn/ui + Radix UI integration
- Clear separation of concerns

### ⚠️ **Areas of Concern**
- Mixed SQLite/Supabase usage (migration in progress)
- No Edge runtime optimization
- Potential real-time gaps
- Some legacy local-db routes still present

### 📈 **Migration Status**
- **Completed:** Login, Settings, Auth verify routes migrated to Supabase
- **In Progress:** Product operations (SKU/Barcode generation)
- **Pending:** Inventory, Orders, Printers, Components, Expenses
- **Legacy:** Local DB routes (should be removed after full migration)
