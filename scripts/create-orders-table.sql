-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    source VARCHAR(100) NOT NULL,
    ordered_products JSONB NOT NULL DEFAULT '[]',
    total_quantity INTEGER NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL CHECK (status IN ('New', 'In Progress', 'Shipped', 'Delivered', 'Cancelled')),
    tracking_number VARCHAR(255),
    shipping_address TEXT,
    notes TEXT,
    order_date DATE NOT NULL,
    shipped_date DATE,
    delivered_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for orders
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically set shipped_date and delivered_date
CREATE OR REPLACE FUNCTION update_order_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- Set shipped_date when status changes to 'Shipped'
    IF NEW.status = 'Shipped' AND OLD.status != 'Shipped' AND NEW.shipped_date IS NULL THEN
        NEW.shipped_date = CURRENT_DATE;
    END IF;
    
    -- Set delivered_date when status changes to 'Delivered'
    IF NEW.status = 'Delivered' AND OLD.status != 'Delivered' AND NEW.delivered_date IS NULL THEN
        NEW.delivered_date = CURRENT_DATE;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update order dates
CREATE TRIGGER auto_update_order_dates
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_order_dates();

-- Create indexes for better performance
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_source ON orders(source);
CREATE INDEX idx_orders_customer_name ON orders(customer_name);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_order_date ON orders(order_date DESC);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_order_id ON orders(order_id);
CREATE INDEX idx_orders_tracking_number ON orders(tracking_number);

-- Create GIN index for JSONB ordered_products column
CREATE INDEX idx_orders_ordered_products ON orders USING GIN (ordered_products);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on orders" ON orders
    FOR ALL USING (true);

-- Insert some sample data
INSERT INTO orders (order_id, customer_name, customer_email, customer_phone, source, ordered_products, total_quantity, total_amount, status, tracking_number, shipping_address, notes, order_date, shipped_date, delivered_date) VALUES
('ORD-240130-A1B', 'John Smith', 'john@email.com', '+1 (555) 123-4567', 'Website', 
 '[{"product_id": "1", "product_name": "Dragon Miniature", "sku": "MINI-001", "quantity": 5, "unit_price": 15.99, "total_price": 79.95}, {"product_id": "2", "product_name": "Phone Stand", "sku": "FUNC-002", "quantity": 2, "unit_price": 12.50, "total_price": 25.00}]',
 7, 104.95, 'In Progress', NULL, '123 Main St, Anytown, ST 12345', 'Customer requested expedited processing', '2024-01-30', NULL, NULL),

('ORD-240129-C2D', 'Sarah Johnson', 'sarah@email.com', NULL, 'Instagram',
 '[{"product_id": "4", "product_name": "Jewelry Pendant", "sku": "DECO-004", "quantity": 3, "unit_price": 24.99, "total_price": 74.97}]',
 3, 74.97, 'Shipped', '1Z999AA1234567890', '456 Oak Ave, Another City, ST 67890', NULL, '2024-01-29', '2024-01-31', NULL),

('ORD-240128-E3F', 'Mike Wilson', NULL, '+1 (555) 987-6543', 'TikTok',
 '[{"product_id": "3", "product_name": "Custom Gear", "sku": "MECH-003", "quantity": 1, "unit_price": 45.00, "total_price": 45.00}]',
 1, 45.00, 'New', NULL, NULL, 'Custom specifications provided via DM', '2024-01-28', NULL, NULL),

('ORD-240127-G4H', 'Emily Davis', 'emily@email.com', NULL, 'Etsy',
 '[{"product_id": "1", "product_name": "Dragon Miniature", "sku": "MINI-001", "quantity": 10, "unit_price": 14.99, "total_price": 149.90}]',
 10, 149.90, 'Delivered', '1Z999AA9876543210', '789 Pine St, Third City, ST 13579', NULL, '2024-01-27', '2024-01-29', '2024-02-01'),

('ORD-240126-I5J', 'David Brown', 'david@email.com', NULL, 'Facebook',
 '[{"product_id": "2", "product_name": "Phone Stand", "sku": "FUNC-002", "quantity": 1, "unit_price": 12.50, "total_price": 12.50}]',
 1, 12.50, 'Cancelled', NULL, NULL, 'Customer requested cancellation due to change of mind', '2024-01-26', NULL, NULL)

ON CONFLICT (order_id) DO NOTHING;
