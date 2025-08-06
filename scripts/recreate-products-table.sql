-- Drop existing products table if it exists
DROP TABLE IF EXISTS products CASCADE;

-- Create products table with correct schema
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    required_materials TEXT[] NOT NULL DEFAULT '{}',
    print_time DECIMAL(5,2) NOT NULL,
    weight INTEGER NOT NULL,
    printer_type VARCHAR(100) NOT NULL,
    image_url TEXT,
    bom_link TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on products" ON products
    FOR ALL USING (true);

-- Allow public access to storage bucket
CREATE POLICY "Allow public access to product images" ON storage.objects
    FOR ALL USING (bucket_id = 'products');

-- Insert sample data
INSERT INTO products (product_name, sku, category, required_materials, print_time, weight, printer_type, image_url, description) VALUES
('Dragon Miniature', 'MINI-001', 'Miniatures', ARRAY['PLA'], 4.5, 35, 'FDM - Standard', '/placeholder.svg?height=100&width=100', 'Detailed dragon miniature for tabletop gaming'),
('Phone Stand', 'FUNC-002', 'Functional Parts', ARRAY['PETG'], 2.0, 45, 'FDM - Standard', '/placeholder.svg?height=100&width=100', 'Adjustable phone stand for desk use'),
('Custom Gear', 'MECH-003', 'Prototypes', ARRAY['Nylon', 'Carbon Fiber'], 6.5, 120, 'FDM - Large Format', '/placeholder.svg?height=100&width=100', 'High-strength mechanical gear prototype'),
('Jewelry Pendant', 'DECO-004', 'Decorative Items', ARRAY['Resin - Standard'], 1.5, 8, 'SLA - Resin', '/placeholder.svg?height=100&width=100', 'Elegant jewelry pendant with intricate details');
