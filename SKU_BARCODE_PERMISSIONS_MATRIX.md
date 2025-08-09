# 🔐 SKU & Barcode Permissions Matrix

## 📋 **Overview**

This document outlines the role-based access control (RBAC) for SKU and barcode generation features in the 3DP Commander system.

## 🎯 **User Roles**

| Role | Description | Permissions |
|------|-------------|-------------|
| **admin** | System administrator | Full access to all features |
| **production** | Production team member | Can generate SKUs and barcodes |
| **sales** | Sales team member | Can read SKU/barcode, cannot generate |
| **inventory** | Inventory team member | Can read SKU/barcode, cannot generate |
| **viewer** | Basic user | Can read SKU/barcode, cannot generate |

## 🔒 **Permissions Matrix**

### **SKU Generation**

| Role | Generate SKU | Read SKU | Update SKU | Delete SKU |
|------|-------------|----------|------------|------------|
| **admin** | ✅ | ✅ | ✅ | ✅ |
| **production** | ✅ | ✅ | ✅ | ❌ |
| **sales** | ❌ | ✅ | ❌ | ❌ |
| **inventory** | ❌ | ✅ | ❌ | ❌ |
| **viewer** | ❌ | ✅ | ❌ | ❌ |

### **Barcode Generation**

| Role | Generate Barcode | Read Barcode | Update Barcode | Delete Barcode |
|------|------------------|--------------|----------------|----------------|
| **admin** | ✅ | ✅ | ✅ | ✅ |
| **production** | ✅ | ✅ | ✅ | ❌ |
| **sales** | ❌ | ✅ | ❌ | ❌ |
| **inventory** | ❌ | ✅ | ❌ | ❌ |
| **viewer** | ❌ | ✅ | ❌ | ❌ |

### **Storage Access**

| Role | Upload Barcode Images | Read Barcode Images | Update Barcode Images | Delete Barcode Images |
|------|----------------------|---------------------|----------------------|----------------------|
| **admin** | ✅ | ✅ | ✅ | ✅ |
| **production** | ✅ | ✅ | ✅ | ❌ |
| **sales** | ❌ | ✅ | ❌ | ❌ |
| **inventory** | ❌ | ✅ | ❌ | ❌ |
| **viewer** | ❌ | ✅ | ❌ | ❌ |

## 🔧 **Implementation Details**

### **1. Database Level (RLS Policies)**

#### **Products Table Policies**
```sql
-- Read: All authenticated users
CREATE POLICY "All roles can read products" ON products
    FOR SELECT USING (auth.role() = 'authenticated');

-- Insert: Admin and Production only
CREATE POLICY "Admin and Production can insert products" ON products
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'production')
        )
    );

-- Update: Admin and Production only
CREATE POLICY "Admin and Production can update products" ON products
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'production')
        )
    );

-- Delete: Admin only
CREATE POLICY "Admin can delete products" ON products
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );
```

#### **Storage Policies**
```sql
-- Read: All authenticated users
CREATE POLICY "All roles can read barcode images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'product-assets' 
        AND auth.role() = 'authenticated'
    );

-- Upload: Admin and Production only
CREATE POLICY "Admin and Production can upload barcode images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'product-assets' 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'production')
        )
    );
```

### **2. API Level (Endpoint Protection)**

#### **SKU Generation Endpoint**
```typescript
// Only admin and production can access
if (!['admin', 'production'].includes(userData.role)) {
  return NextResponse.json(
    { error: 'Insufficient permissions. Only admin and production roles can generate SKUs.' },
    { status: 403 }
  )
}
```

#### **Barcode Generation Endpoint**
```typescript
// Only admin and production can access
if (!['admin', 'production'].includes(userData.role)) {
  return NextResponse.json(
    { error: 'Insufficient permissions. Only admin and production roles can generate barcodes.' },
    { status: 403 }
  )
}
```

### **3. UI Level (Conditional Rendering)**

#### **Generate SKU Button**
```typescript
{userRole && ['admin', 'production'].includes(userRole) ? (
  <Button onClick={generateSKU}>Generate SKU</Button>
) : (
  <div>SKU generation requires admin or production role</div>
)}
```

#### **Generate Barcode Button**
```typescript
{userRole && ['admin', 'production'].includes(userRole) ? (
  <Button onClick={generateBarcode}>Generate Barcode</Button>
) : (
  <div>Barcode generation requires admin or production role</div>
)}
```

## 🚀 **Usage Scenarios**

### **Scenario 1: Admin User**
- **Actions**: Can generate SKUs, generate barcodes, read all data, update all data, delete products
- **UI**: Sees all generate buttons enabled
- **API**: All endpoints accessible
- **Database**: Full CRUD access

### **Scenario 2: Production User**
- **Actions**: Can generate SKUs, generate barcodes, read all data, update products
- **UI**: Sees generate buttons enabled
- **API**: SKU and barcode generation endpoints accessible
- **Database**: Read, insert, update access (no delete)

### **Scenario 3: Sales User**
- **Actions**: Can read SKU/barcode data, cannot generate
- **UI**: Sees generate buttons disabled with permission message
- **API**: Generation endpoints return 403 error
- **Database**: Read-only access

### **Scenario 4: Inventory User**
- **Actions**: Can read SKU/barcode data, cannot generate
- **UI**: Sees generate buttons disabled with permission message
- **API**: Generation endpoints return 403 error
- **Database**: Read-only access

### **Scenario 5: Viewer User**
- **Actions**: Can read SKU/barcode data, cannot generate
- **UI**: Sees generate buttons disabled with permission message
- **API**: Generation endpoints return 403 error
- **Database**: Read-only access

## 🔍 **Security Features**

### **1. Multi-Layer Protection**
- **Database**: RLS policies enforce access at data level
- **API**: Endpoint-level authentication and authorization
- **UI**: Conditional rendering based on user role
- **Storage**: Bucket-level policies for file access

### **2. Authentication Flow**
1. User logs in and receives JWT token
2. Token stored in localStorage
3. API calls include Authorization header
4. Server validates token and checks user role
5. Access granted/denied based on role

### **3. Error Handling**
- **401 Unauthorized**: No valid authentication token
- **403 Forbidden**: Valid token but insufficient permissions
- **404 Not Found**: User not found in database
- **500 Internal Server Error**: Server-side errors

## 📊 **Audit Trail**

### **Database Functions**
```sql
-- Check if user can generate SKU/barcode
CREATE OR REPLACE FUNCTION can_generate_sku_barcode()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND role IN ('admin', 'production')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can read SKU/barcode
CREATE OR REPLACE FUNCTION can_read_sku_barcode()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND role IN ('admin', 'production', 'sales', 'inventory')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🔮 **Future Enhancements**

### **Potential Improvements**
- **Audit Logging**: Track all SKU/barcode generation attempts
- **Rate Limiting**: Prevent abuse of generation endpoints
- **Approval Workflow**: Require approval for certain operations
- **Role Inheritance**: Allow role-based permission inheritance
- **Temporary Permissions**: Grant temporary access for specific tasks

### **Monitoring & Analytics**
- **Usage Tracking**: Monitor which roles use generation features
- **Error Monitoring**: Track permission denial patterns
- **Performance Metrics**: Monitor API response times
- **Security Alerts**: Detect suspicious access patterns

The SKU & Barcode Permissions Matrix ensures secure, role-based access control while maintaining usability for authorized users.
