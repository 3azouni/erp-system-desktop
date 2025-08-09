# 🔐 Supabase RLS Policy Map & Database Schema

## 📋 **Verified Tables**

✅ **All Required Tables Confirmed:**

1. **users** - User authentication and profiles
2. **products** - Product catalog with SKU and materials
3. **inventory** - Material inventory (filament, resin, etc.)
4. **printers** - 3D printer management
5. **print_jobs** - Print job scheduling and tracking
6. **orders** - Customer orders (with JSONB ordered_products)
7. **expenses** - Business expense tracking
8. **app_settings** - Application configuration
9. **notifications** - User notifications
10. **components** - Component inventory
11. **component_inventory** - Component stock levels
12. **finished_goods_inventory** - Finished product inventory
13. **user_notification_preferences** - User notification settings
14. **bom_calculations** - Bill of Materials calculations

## 🔒 **RLS Policy Map**

### **USERS TABLE**
| Operation | Who Can Access | Policy Name |
|-----------|----------------|-------------|
| **READ** | Own profile + Admins | `Users can read own profile` + `Admins can read all users` |
| **UPDATE** | Own profile + Admins | `Users can update own profile` + `Admins can manage all users` |
| **INSERT/DELETE** | Admins only | `Admins can manage all users` |

### **PRODUCTS TABLE**
| Operation | Who Can Access | Policy Name |
|-----------|----------------|-------------|
| **READ** | All authenticated users | `Authenticated users can read products` |
| **INSERT/UPDATE** | Admins + Managers | `Admins and managers can insert/update products` |
| **DELETE** | Admins only | `Admins can delete products` |

### **INVENTORY TABLE**
| Operation | Who Can Access | Policy Name |
|-----------|----------------|-------------|
| **READ** | All authenticated users | `Authenticated users can read inventory` |
| **INSERT/UPDATE** | Admins + Managers | `Admins and managers can insert/update inventory` |
| **DELETE** | Admins only | `Admins can delete inventory` |

### **PRINTERS TABLE**
| Operation | Who Can Access | Policy Name |
|-----------|----------------|-------------|
| **READ** | All authenticated users | `Authenticated users can read printers` |
| **INSERT/UPDATE** | Admins + Managers | `Admins and managers can insert/update printers` |
| **DELETE** | Admins only | `Admins can delete printers` |

### **ORDERS TABLE**
| Operation | Who Can Access | Policy Name |
|-----------|----------------|-------------|
| **READ** | All authenticated users | `Authenticated users can read orders` |
| **INSERT/UPDATE** | Admins + Managers | `Admins and managers can insert/update orders` |
| **DELETE** | Admins only | `Admins can delete orders` |

### **EXPENSES TABLE**
| Operation | Who Can Access | Policy Name |
|-----------|----------------|-------------|
| **READ** | All authenticated users | `Authenticated users can read expenses` |
| **INSERT/UPDATE** | Admins + Managers | `Admins and managers can insert/update expenses` |
| **DELETE** | Admins only | `Admins can delete expenses` |

### **PRINT_JOBS TABLE**
| Operation | Who Can Access | Policy Name |
|-----------|----------------|-------------|
| **READ** | All authenticated users | `Authenticated users can read print jobs` |
| **INSERT/UPDATE** | Admins + Managers | `Admins and managers can insert/update print jobs` |
| **DELETE** | Admins only | `Admins can delete print jobs` |

### **APP_SETTINGS TABLE**
| Operation | Who Can Access | Policy Name |
|-----------|----------------|-------------|
| **READ** | All authenticated users | `Authenticated users can read app settings` |
| **ALL OPERATIONS** | Admins only | `Admins can manage app settings` |

### **NOTIFICATIONS TABLE**
| Operation | Who Can Access | Policy Name |
|-----------|----------------|-------------|
| **READ** | Own notifications + Admins | `Users can read own notifications` + `Admins can read all notifications` |
| **UPDATE** | Own notifications + Admins | `Users can update own notifications` + `Admins can manage all notifications` |
| **INSERT/DELETE** | Admins only | `Admins can manage all notifications` |

### **COMPONENTS TABLE**
| Operation | Who Can Access | Policy Name |
|-----------|----------------|-------------|
| **READ** | All authenticated users | `Authenticated users can read components` |
| **INSERT/UPDATE** | Admins + Managers | `Admins and managers can insert/update components` |
| **DELETE** | Admins only | `Admins can delete components` |

### **COMPONENT_INVENTORY TABLE**
| Operation | Who Can Access | Policy Name |
|-----------|----------------|-------------|
| **READ** | All authenticated users | `Authenticated users can read component inventory` |
| **INSERT/UPDATE** | Admins + Managers | `Admins and managers can insert/update component inventory` |
| **DELETE** | Admins only | `Admins can delete component inventory` |

### **FINISHED_GOODS_INVENTORY TABLE**
| Operation | Who Can Access | Policy Name |
|-----------|----------------|-------------|
| **READ** | All authenticated users | `Authenticated users can read finished goods inventory` |
| **INSERT/UPDATE** | Admins + Managers | `Admins and managers can insert/update finished goods inventory` |
| **DELETE** | Admins only | `Admins can delete finished goods inventory` |

### **USER_NOTIFICATION_PREFERENCES TABLE**
| Operation | Who Can Access | Policy Name |
|-----------|----------------|-------------|
| **READ** | Own preferences + Admins | `Users can read own notification preferences` + `Admins can read all notification preferences` |
| **INSERT/UPDATE** | Own preferences | `Users can insert/update own notification preferences` |

### **BOM_CALCULATIONS TABLE**
| Operation | Who Can Access | Policy Name |
|-----------|----------------|-------------|
| **READ** | All authenticated users | `Authenticated users can read BOM calculations` |
| **INSERT/UPDATE** | Admins + Managers | `Admins and managers can insert/update BOM calculations` |
| **DELETE** | Admins only | `Admins can delete BOM calculations` |

## 🔍 **Existing RPC Functions & Views**

### **Global Search Function**
- **Name**: `/api/search` (Next.js API route)
- **Purpose**: Cross-module search across products, orders, and inventory
- **Tables Used**: `products`, `orders`, `inventory`
- **Search Fields**: 
  - Products: `product_name`, `sku`, `category`
  - Orders: `order_id`, `customer_name`, `source`
  - Inventory: `material_name`, `material_type`, `supplier`

### **Analytics Functions**
- **Current**: Client-side analytics using existing data
- **No RPC functions found** - analytics are computed in the frontend
- **Tables Used**: All tables for dashboard metrics

## 📊 **Role-Based Access Summary**

### **Admin Role**
- ✅ **Full access** to all tables
- ✅ **User management** (create, read, update, delete users)
- ✅ **System settings** (app_settings table)
- ✅ **Delete operations** on all tables

### **Manager Role**
- ✅ **Read access** to all tables
- ✅ **Create/Update** on business data tables
- ❌ **No delete** permissions
- ❌ **No user management**
- ❌ **No system settings** access

### **Viewer Role**
- ✅ **Read access** to all tables
- ✅ **Update own profile**
- ✅ **Update own notification preferences**
- ❌ **No create/delete** permissions
- ❌ **No business data modifications**

## 🚀 **Setup Instructions**

### **1. Run Schema Setup**
```sql
-- Execute in Supabase SQL Editor
\i scripts/supabase-schema-setup.sql
```

### **2. Apply RLS Policies**
```sql
-- Execute in Supabase SQL Editor
\i scripts/supabase-rls-policies.sql
```

### **3. Create Default Admin User**
```sql
-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, full_name, role, department, is_active)
VALUES (
    'admin@3dpcommander.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i', -- bcrypt hash of 'admin123'
    'System Administrator',
    'admin',
    'general',
    true
);
```

### **4. Create Default App Settings**
```sql
-- Insert default app settings
INSERT INTO app_settings (
    electricity_cost_per_kwh,
    labor_rate_per_hour,
    default_marketing_percentage,
    platform_fee_percentage,
    misc_buffer_percentage,
    currency,
    app_name,
    footer_text,
    printer_profiles
) VALUES (
    0.12,
    25.00,
    10.00,
    5.00,
    5.00,
    'USD',
    '3DP Commander',
    'Powered by 3DP Commander - 3D Printing Business Management',
    '[]'::jsonb
);
```

## 🔧 **Migration Notes**

### **Key Changes from SQLite**
1. **UUID Primary Keys** - All tables use UUID instead of INTEGER
2. **JSONB for Arrays** - `required_materials`, `ordered_products`, `printer_profiles` use JSONB
3. **Timestamps** - All tables use `TIMESTAMP WITH TIME ZONE`
4. **Foreign Keys** - Proper UUID foreign key relationships
5. **RLS Enabled** - All tables have Row Level Security enabled

### **No Destructive Changes**
- ✅ **No tables renamed**
- ✅ **No columns dropped**
- ✅ **No data loss**
- ✅ **Backward compatible** structure

## 📈 **Performance Optimizations**

### **Indexes Created**
- **Primary keys** on all tables
- **Foreign key indexes** for relationships
- **Search indexes** on frequently queried columns
- **GIN index** on JSONB `ordered_products` column
- **Date-based indexes** for analytics queries

### **Triggers**
- **Automatic `updated_at`** timestamps on all tables
- **Consistent timestamp** management

## 🔐 **Security Features**

### **Row Level Security**
- ✅ **Enabled on all tables**
- ✅ **Role-based access control**
- ✅ **User isolation** for personal data
- ✅ **Admin override** for system management

### **Authentication Integration**
- ✅ **Supabase Auth** integration
- ✅ **JWT token** validation
- ✅ **Session management**
- ✅ **Secure password** hashing (bcrypt)

The database schema and RLS policies are now ready for production deployment with proper security and performance optimizations.
