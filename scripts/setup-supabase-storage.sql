-- =====================================================
-- Supabase Storage Setup for Product Assets
-- =====================================================

-- Create storage bucket for product assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-assets',
  'product-assets',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for barcodes specifically
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'barcodes',
  'barcodes',
  true,
  1048576, -- 1MB limit
  ARRAY['image/png']
) ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for product-assets bucket
CREATE POLICY "Public read access for product assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-assets');

CREATE POLICY "Authenticated users can upload product assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-assets' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Product owners can update their assets" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-assets' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Product owners can delete their assets" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-assets' 
    AND auth.role() = 'authenticated'
  );

-- Set up RLS policies for barcodes bucket
CREATE POLICY "Public read access for barcodes" ON storage.objects
  FOR SELECT USING (bucket_id = 'barcodes');

CREATE POLICY "Authenticated users can upload barcodes" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'barcodes' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Product owners can update their barcodes" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'barcodes' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Product owners can delete their barcodes" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'barcodes' 
    AND auth.role() = 'authenticated'
  );

-- Create function to clean up orphaned barcode files
CREATE OR REPLACE FUNCTION cleanup_orphaned_barcodes()
RETURNS void AS $$
BEGIN
  -- Delete barcode files that don't have corresponding products
  DELETE FROM storage.objects 
  WHERE bucket_id = 'barcodes' 
    AND name NOT IN (
      SELECT CONCAT('barcodes/', id, '.png') 
      FROM products 
      WHERE barcode_image_url IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to clean up barcode files when products are deleted
CREATE OR REPLACE FUNCTION cleanup_product_barcode()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.barcode_image_url IS NOT NULL THEN
    -- Extract filename from URL and delete from storage
    DELETE FROM storage.objects 
    WHERE bucket_id = 'product-assets' 
      AND name = CONCAT('barcodes/', OLD.id, '.png');
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_product_barcode
  BEFORE DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_product_barcode();
