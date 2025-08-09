-- =====================================================
-- SKU & Barcode RLS Policies for 3DP Commander
-- =====================================================

-- =====================================================
-- PRODUCTS TABLE - SKU & BARCODE SPECIFIC POLICIES
-- =====================================================

-- Drop existing products policies to replace with role-specific ones
DROP POLICY IF EXISTS "Authenticated users can read products" ON products;
DROP POLICY IF EXISTS "Admins and managers can insert products" ON products;
DROP POLICY IF EXISTS "Admins and managers can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;

-- =====================================================
-- READ POLICIES (All roles can read SKU/barcode fields)
-- =====================================================

-- All authenticated users can read products (including SKU/barcode)
CREATE POLICY "All roles can read products" ON products
    FOR SELECT USING (auth.role() = 'authenticated');

-- =====================================================
-- INSERT POLICIES (Admin and Production only)
-- =====================================================

-- Admin and Production can insert products (including SKU generation)
CREATE POLICY "Admin and Production can insert products" ON products
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'production')
        )
    );

-- =====================================================
-- UPDATE POLICIES (Admin and Production only for SKU/barcode)
-- =====================================================

-- Admin and Production can update products (including SKU/barcode generation)
CREATE POLICY "Admin and Production can update products" ON products
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'production')
        )
    );

-- =====================================================
-- DELETE POLICIES (Admin only)
-- =====================================================

-- Only Admin can delete products
CREATE POLICY "Admin can delete products" ON products
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- =====================================================
-- STORAGE POLICIES FOR BARCODE IMAGES
-- =====================================================

-- Drop existing storage policies for product-assets
DROP POLICY IF EXISTS "Public read access for product assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product assets" ON storage.objects;
DROP POLICY IF EXISTS "Product owners can update their assets" ON storage.objects;
DROP POLICY IF EXISTS "Product owners can delete their assets" ON storage.objects;

-- All authenticated users can read barcode images
CREATE POLICY "All roles can read barcode images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'product-assets' 
        AND auth.role() = 'authenticated'
    );

-- Admin and Production can upload barcode images
CREATE POLICY "Admin and Production can upload barcode images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'product-assets' 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'production')
        )
    );

-- Admin and Production can update barcode images
CREATE POLICY "Admin and Production can update barcode images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'product-assets' 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'production')
        )
    );

-- Admin can delete barcode images
CREATE POLICY "Admin can delete barcode images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'product-assets' 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- =====================================================
-- API ENDPOINT ACCESS CONTROL
-- =====================================================

-- Create function to check if user can generate SKU/barcode
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

-- Create function to check if user can read SKU/barcode
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
