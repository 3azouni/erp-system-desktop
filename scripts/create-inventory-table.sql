-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    material_name VARCHAR(255) NOT NULL,
    material_type VARCHAR(100) NOT NULL,
    color VARCHAR(50) NOT NULL,
    price_per_kg DECIMAL(10,2) NOT NULL,
    quantity_available INTEGER NOT NULL DEFAULT 0,
    supplier VARCHAR(255) NOT NULL,
    minimum_threshold INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Normal', 'Low', 'Out')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for inventory
CREATE TRIGGER update_inventory_updated_at 
    BEFORE UPDATE ON inventory 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically update status based on quantity
CREATE OR REPLACE FUNCTION update_inventory_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quantity_available <= 0 THEN
        NEW.status = 'Out';
    ELSIF NEW.quantity_available <= NEW.minimum_threshold THEN
        NEW.status = 'Low';
    ELSE
        NEW.status = 'Normal';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update status
CREATE TRIGGER auto_update_inventory_status
    BEFORE INSERT OR UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_status();

-- Create indexes for better performance
CREATE INDEX idx_inventory_material_type ON inventory(material_type);
CREATE INDEX idx_inventory_status ON inventory(status);
CREATE INDEX idx_inventory_supplier ON inventory(supplier);
CREATE INDEX idx_inventory_created_at ON inventory(created_at DESC);

-- Enable RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on inventory" ON inventory
    FOR ALL USING (true);

-- Insert some sample data
INSERT INTO inventory (material_name, material_type, color, price_per_kg, quantity_available, supplier, minimum_threshold, notes) VALUES
('Premium PLA Black', 'PLA', 'Black', 25.99, 850, 'Hatchbox', 200, 'High quality, consistent diameter'),
('PETG Clear', 'PETG', 'Clear', 32.50, 150, 'eSUN', 200, 'Great for transparent parts'),
('TPU Flexible Red', 'TPU', 'Red', 45.00, 0, 'Overture', 100, 'Shore 95A hardness'),
('Wood Fill Natural', 'Wood Fill', 'Natural', 38.99, 750, 'Polymaker', 150, 'Can be sanded and stained'),
('Standard Resin Gray', 'Resin - Standard', 'Gray', 55.00, 80, 'ELEGOO', 100, 'UV curing resin')
ON CONFLICT DO NOTHING;
