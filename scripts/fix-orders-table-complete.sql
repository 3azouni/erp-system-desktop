-- Drop existing orders table and recreate with all required columns
DROP TABLE IF EXISTS orders CASCADE;

-- Create orders table with complete schema
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    source VARCHAR(100) NOT NULL,
    ordered_products JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_quantity INTEGER NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'In Progress', 'Shipped', 'Delivered', 'Cancelled')),
    tracking_number VARCHAR(100),
    shipping_address TEXT,
    notes TEXT,
    order_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    shipped_date TIMESTAMP WITH TIME ZONE,
    delivered_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_orders_order_id ON orders(order_id);
CREATE INDEX idx_orders_customer_name ON orders(customer_name);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_source ON orders(source);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to automatically set shipped_date when status changes to 'Shipped'
CREATE OR REPLACE FUNCTION update_shipped_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Shipped' AND OLD.status != 'Shipped' THEN
        NEW.shipped_date = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_shipped_date 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_shipped_date();

-- Create trigger to automatically set delivered_date when status changes to 'Delivered'
CREATE OR REPLACE FUNCTION update_delivered_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Delivered' AND OLD.status != 'Delivered' THEN
        NEW.delivered_date = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_delivered_date 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_delivered_date();

-- Insert sample data with proper UUID format and realistic data
INSERT INTO orders (
    order_id, 
    customer_name, 
    customer_email, 
    customer_phone, 
    source, 
    ordered_products, 
    total_quantity, 
    total_amount, 
    status, 
    order_date,
    notes
) VALUES 
(
    'ORD-2024-001',
    'John Smith',
    'john.smith@email.com',
    '+1-555-0123',
    'Website',
    '[
        {
            "product_id": "550e8400-e29b-41d4-a716-446655440001",
            "product_name": "Custom Phone Case",
            "sku": "CASE-001",
            "quantity": 2,
            "unit_price": 25.00,
            "total_price": 50.00
        }
    ]'::jsonb,
    2,
    50.00,
    'New',
    '2024-01-15 10:30:00+00',
    'Customer requested blue color'
),
(
    'ORD-2024-002',
    'Sarah Johnson',
    'sarah.j@email.com',
    '+1-555-0124',
    'Instagram',
    '[
        {
            "product_id": "550e8400-e29b-41d4-a716-446655440002",
            "product_name": "Miniature Dragon",
            "sku": "MINI-001",
            "quantity": 1,
            "unit_price": 35.00,
            "total_price": 35.00
        },
        {
            "product_id": "550e8400-e29b-41d4-a716-446655440003",
            "product_name": "Desk Organizer",
            "sku": "ORG-001",
            "quantity": 1,
            "unit_price": 28.00,
            "total_price": 28.00
        }
    ]'::jsonb,
    2,
    63.00,
    'In Progress',
    '2024-01-14 14:20:00+00',
    'Rush order - needed by Friday'
),
(
    'ORD-2024-003',
    'Mike Wilson',
    'mike.wilson@email.com',
    '+1-555-0125',
    'TikTok',
    '[
        {
            "product_id": "550e8400-e29b-41d4-a716-446655440004",
            "product_name": "Custom Keychain",
            "sku": "KEY-001",
            "quantity": 5,
            "unit_price": 8.00,
            "total_price": 40.00
        }
    ]'::jsonb,
    5,
    40.00,
    'Shipped',
    '2024-01-12 09:15:00+00',
    'Bulk order for team gifts'
),
(
    'ORD-2024-004',
    'Emily Davis',
    'emily.davis@email.com',
    '+1-555-0126',
    'Etsy',
    '[
        {
            "product_id": "550e8400-e29b-41d4-a716-446655440005",
            "product_name": "Plant Pot",
            "sku": "POT-001",
            "quantity": 3,
            "unit_price": 22.00,
            "total_price": 66.00
        }
    ]'::jsonb,
    3,
    66.00,
    'Delivered',
    '2024-01-10 16:45:00+00',
    'Customer loves plants'
),
(
    'ORD-2024-005',
    'David Brown',
    'david.brown@email.com',
    '+1-555-0127',
    'Facebook',
    '[
        {
            "product_id": "550e8400-e29b-41d4-a716-446655440006",
            "product_name": "Prototype Part",
            "sku": "PROTO-001",
            "quantity": 1,
            "unit_price": 120.00,
            "total_price": 120.00
        }
    ]'::jsonb,
    1,
    120.00,
    'New',
    '2024-01-16 11:00:00+00',
    'Engineering prototype - high precision required'
);

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Verify sample data
SELECT order_id, customer_name, source, status, total_quantity, total_amount, order_date 
FROM orders 
ORDER BY order_date DESC;
