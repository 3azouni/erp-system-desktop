-- =====================================================
-- Add Barcode Fields to Products Table
-- =====================================================

-- Add new barcode fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS barcode_type VARCHAR(20) CHECK (barcode_type IN ('EAN13', 'CODE128', 'QR')),
ADD COLUMN IF NOT EXISTS barcode_value TEXT,
ADD COLUMN IF NOT EXISTS barcode_image_url TEXT;

-- Create index for barcode_value for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_barcode_value ON products(barcode_value) WHERE barcode_value IS NOT NULL;

-- Create index for barcode_type for filtering
CREATE INDEX IF NOT EXISTS idx_products_barcode_type ON products(barcode_type) WHERE barcode_type IS NOT NULL;

-- Add comment to document the new fields
COMMENT ON COLUMN products.barcode_type IS 'Type of barcode: EAN13, CODE128, or QR';
COMMENT ON COLUMN products.barcode_value IS 'The actual barcode value/string';
COMMENT ON COLUMN products.barcode_image_url IS 'URL to generated barcode image (optional)';
