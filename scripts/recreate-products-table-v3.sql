-- Drop the existing products table if it exists
DROP TABLE IF EXISTS products CASCADE;

-- Create the products table with the correct schema
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    required_materials TEXT[] NOT NULL DEFAULT '{}',
    print_time DECIMAL(5,2) NOT NULL DEFAULT 0,
    weight INTEGER NOT NULL DEFAULT 0,
    printer_type VARCHAR(100) NOT NULL,
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_printer_type ON products(printer_type);

-- Insert some sample data
INSERT INTO products (product_name, sku, category, required_materials, print_time, weight, printer_type, description) VALUES
('Dragon Miniature', 'DRG-001', 'Miniatures', '{"PLA", "Support Material"}', 4.5, 25, 'Resin Printer', 'Detailed dragon miniature for tabletop gaming'),
('Phone Stand', 'PHN-001', 'Functional Parts', '{"PETG"}', 2.0, 45, 'FDM Printer', 'Adjustable phone stand for desk use'),
('Prototype Housing', 'PRT-001', 'Prototypes', '{"ABS", "TPU"}', 6.0, 120, 'FDM Printer', 'Electronic device housing prototype'),
('Decorative Vase', 'VAS-001', 'Decorative Items', '{"PLA", "Wood Fill"}', 8.0, 200, 'FDM Printer', 'Spiral vase with wood-like finish'),
('Wrench Set', 'WRN-001', 'Tools & Accessories', '{"PETG-CF"}', 3.5, 80, 'FDM Printer', 'Set of 3D printed wrenches');
