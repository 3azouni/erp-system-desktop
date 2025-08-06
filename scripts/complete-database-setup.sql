-- Complete 3DP Commander Database Setup Script
-- Run this to set up the local SQLite database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS print_jobs CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS printers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;

-- Create Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    required_materials TEXT[] DEFAULT '{}',
    print_time DECIMAL(5,2) NOT NULL DEFAULT 0,
    weight INTEGER NOT NULL DEFAULT 0,
    printer_type VARCHAR(100) NOT NULL,
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Inventory table
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_name VARCHAR(255) NOT NULL,
    material_type VARCHAR(100) NOT NULL,
    color VARCHAR(100) NOT NULL,
    price_per_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
    quantity_available INTEGER NOT NULL DEFAULT 0,
    supplier VARCHAR(255) NOT NULL,
    minimum_threshold INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'Normal' CHECK (status IN ('Normal', 'Low', 'Out')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Printers table
CREATE TABLE printers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    printer_name VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Idle' CHECK (status IN ('Idle', 'Printing', 'Maintenance', 'Offline')),
    power_consumption DECIMAL(10,2) NOT NULL DEFAULT 0,
    hours_printed DECIMAL(10,2) NOT NULL DEFAULT 0,
    last_maintenance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    job_queue INTEGER NOT NULL DEFAULT 0,
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(100) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    source VARCHAR(100) NOT NULL,
    ordered_products JSONB NOT NULL DEFAULT '[]',
    total_quantity INTEGER NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'In Progress', 'Shipped', 'Delivered', 'Cancelled')),
    tracking_number VARCHAR(255),
    shipping_address TEXT,
    notes TEXT,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    shipped_date DATE,
    delivered_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Expenses table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_type VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    vendor VARCHAR(255),
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Print Jobs table
CREATE TABLE print_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    printer_id UUID NOT NULL REFERENCES printers(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    estimated_print_time DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'Queued' CHECK (status IN ('Queued', 'Printing', 'Completed', 'Failed')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create App Settings table
CREATE TABLE app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    electricity_cost_per_kwh DECIMAL(10,4) NOT NULL DEFAULT 0.12,
    labor_rate_per_hour DECIMAL(10,2) NOT NULL DEFAULT 25.00,
    default_marketing_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    platform_fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    misc_buffer_percentage DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    app_name VARCHAR(255) NOT NULL DEFAULT '3DP Commander',
    app_logo_url TEXT,
    footer_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_inventory_status ON inventory(status);
CREATE INDEX idx_printers_status ON printers(status);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_print_jobs_status ON print_jobs(status);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_printers_updated_at BEFORE UPDATE ON printers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_print_jobs_updated_at BEFORE UPDATE ON print_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data

-- Sample Products
INSERT INTO products (product_name, sku, category, required_materials, print_time, weight, printer_type, description) VALUES
('Dragon Miniature', '3DP-001', 'Miniatures', '{"PLA", "Support Material"}', 4.5, 25, 'FDM', 'Detailed dragon miniature for tabletop gaming'),
('Phone Stand', '3DP-002', 'Functional Parts', '{"PETG"}', 2.0, 45, 'FDM', 'Adjustable phone stand for desk use'),
('Prototype Housing', '3DP-003', 'Prototypes', '{"ABS", "TPU"}', 6.0, 120, 'FDM', 'Electronic device housing prototype'),
('Decorative Vase', '3DP-004', 'Decorative Items', '{"PLA+", "Wood Fill"}', 8.0, 200, 'FDM', 'Spiral vase with wood-like finish'),
('Wrench Set', '3DP-005', 'Tools & Accessories', '{"Nylon", "Carbon Fiber"}', 3.5, 80, 'FDM', 'Set of 3D printed wrenches'),
('Gear Assembly', '3DP-006', 'Educational Models', '{"PLA"}', 5.0, 60, 'FDM', 'Working gear mechanism for education'),
('Custom Bracket', '3DP-007', 'Custom Parts', '{"PETG"}', 1.5, 30, 'FDM', 'Custom mounting bracket'),
('Jewelry Pendant', '3DP-008', 'Decorative Items', '{"Resin"}', 0.5, 5, 'SLA', 'High-detail jewelry pendant');

-- Sample Inventory
INSERT INTO inventory (material_name, material_type, color, price_per_kg, quantity_available, supplier, minimum_threshold, status) VALUES
('PLA Basic', 'PLA', 'White', 25.00, 5000, 'FilamentCo', 1000, 'Normal'),
('PLA Basic', 'PLA', 'Black', 25.00, 800, 'FilamentCo', 1000, 'Low'),
('PETG Premium', 'PETG', 'Clear', 35.00, 2000, 'TechFilament', 500, 'Normal'),
('ABS Industrial', 'ABS', 'Gray', 30.00, 1500, 'ProMaterials', 500, 'Normal'),
('TPU Flexible', 'TPU', 'Red', 45.00, 300, 'FlexiPrint', 200, 'Normal'),
('PLA+ Enhanced', 'PLA+', 'Blue', 28.00, 100, 'FilamentCo', 500, 'Out'),
('Wood Fill PLA', 'PLA', 'Brown', 40.00, 750, 'NaturalFil', 300, 'Normal'),
('Carbon Fiber Nylon', 'Nylon', 'Black', 80.00, 400, 'AdvancedMat', 200, 'Normal');

-- Sample Printers
INSERT INTO printers (printer_name, model, status, power_consumption, hours_printed, last_maintenance_date, job_queue, location) VALUES
('Printer Alpha', 'Prusa i3 MK3S+', 'Printing', 120.0, 1250.5, '2024-01-15', 2, 'Workshop A'),
('Printer Beta', 'Ender 3 V2', 'Idle', 100.0, 890.0, '2024-01-10', 0, 'Workshop A'),
('Printer Gamma', 'Bambu Lab X1', 'Printing', 150.0, 2100.75, '2024-01-20', 3, 'Workshop B'),
('Printer Delta', 'Ultimaker S3', 'Maintenance', 200.0, 1800.25, '2024-01-05', 0, 'Workshop B'),
('Printer Epsilon', 'Formlabs Form 3', 'Idle', 80.0, 450.0, '2024-01-18', 1, 'Resin Station'),
('Printer Zeta', 'Prusa MINI+', 'Printing', 90.0, 650.5, '2024-01-12', 1, 'Workshop A'),
('Printer Eta', 'Artillery Sidewinder', 'Offline', 110.0, 320.0, '2024-01-08', 0, 'Storage'),
('Printer Theta', 'Creality CR-10', 'Idle', 130.0, 1100.0, '2024-01-16', 0, 'Workshop C');

-- Sample Orders
INSERT INTO orders (order_id, customer_name, customer_email, source, ordered_products, total_quantity, total_amount, status, order_date) VALUES
('ORD-2024-001', 'John Smith', 'john@email.com', 'Website', '[{"product_id": "3DP-001", "product_name": "Dragon Miniature", "quantity": 5, "unit_price": 15.00, "total_price": 75.00}]', 5, 75.00, 'In Progress', '2024-01-20'),
('ORD-2024-002', 'Sarah Johnson', 'sarah@email.com', 'Instagram', '[{"product_id": "3DP-002", "product_name": "Phone Stand", "quantity": 2, "unit_price": 12.00, "total_price": 24.00}]', 2, 24.00, 'Shipped', '2024-01-18'),
('ORD-2024-003', 'TechCorp Inc', 'orders@techcorp.com', 'Direct', '[{"product_id": "3DP-003", "product_name": "Prototype Housing", "quantity": 10, "unit_price": 45.00, "total_price": 450.00}]', 10, 450.00, 'New', '2024-01-22'),
('ORD-2024-004', 'Mike Wilson', 'mike@email.com', 'Etsy', '[{"product_id": "3DP-004", "product_name": "Decorative Vase", "quantity": 1, "unit_price": 35.00, "total_price": 35.00}]', 1, 35.00, 'Delivered', '2024-01-15');

-- Sample Expenses
INSERT INTO expenses (expense_type, amount, date, description, vendor) VALUES
('Filament Purchase', 250.00, '2024-01-15', 'PLA and PETG filament restock', 'FilamentCo'),
('Software', 99.00, '2024-01-01', 'Annual Fusion 360 subscription', 'Autodesk'),
('Marketing', 150.00, '2024-01-10', 'Instagram ads campaign', 'Meta'),
('Maintenance', 75.00, '2024-01-12', 'Printer nozzle replacement', 'PrinterParts'),
('Electricity', 180.00, '2024-01-01', 'Monthly electricity bill', 'PowerCorp'),
('Packaging', 45.00, '2024-01-18', 'Shipping boxes and bubble wrap', 'PackagingPlus');

-- Sample Print Jobs
INSERT INTO print_jobs (product_id, printer_id, quantity, estimated_print_time, status) 
SELECT 
    p.id as product_id,
    pr.id as printer_id,
    2 as quantity,
    p.print_time * 2 as estimated_print_time,
    'Queued' as status
FROM products p, printers pr 
WHERE p.sku = '3DP-001' AND pr.printer_name = 'Printer Alpha'
LIMIT 1;

INSERT INTO print_jobs (product_id, printer_id, quantity, estimated_print_time, status, started_at) 
SELECT 
    p.id as product_id,
    pr.id as printer_id,
    1 as quantity,
    p.print_time as estimated_print_time,
    'Printing' as status,
    NOW() - INTERVAL '2 hours' as started_at
FROM products p, printers pr 
WHERE p.sku = '3DP-002' AND pr.printer_name = 'Printer Beta'
LIMIT 1;

-- Insert default app settings
INSERT INTO app_settings (
    electricity_cost_per_kwh,
    labor_rate_per_hour,
    default_marketing_percentage,
    platform_fee_percentage,
    misc_buffer_percentage,
    currency,
    app_name,
    footer_text
) VALUES (
    0.12,
    25.00,
    10.00,
    5.00,
    5.00,
    'USD',
    '3DP Commander',
    'Powered by 3DP Commander - Professional 3D Printing Management'
);

-- Enable Row Level Security (RLS) - Optional, uncomment if needed
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE printers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
-- CREATE POLICY "Public access" ON products FOR ALL USING (true);
-- CREATE POLICY "Public access" ON inventory FOR ALL USING (true);
-- CREATE POLICY "Public access" ON printers FOR ALL USING (true);
-- CREATE POLICY "Public access" ON orders FOR ALL USING (true);
-- CREATE POLICY "Public access" ON expenses FOR ALL USING (true);
-- CREATE POLICY "Public access" ON print_jobs FOR ALL USING (true);
-- CREATE POLICY "Public access" ON app_settings FOR ALL USING (true);

-- Verify the setup
SELECT 'Products' as table_name, COUNT(*) as record_count FROM products
UNION ALL
SELECT 'Inventory', COUNT(*) FROM inventory
UNION ALL
SELECT 'Printers', COUNT(*) FROM printers
UNION ALL
SELECT 'Orders', COUNT(*) FROM orders
UNION ALL
SELECT 'Expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'Print Jobs', COUNT(*) FROM print_jobs
UNION ALL
SELECT 'App Settings', COUNT(*) FROM app_settings;
