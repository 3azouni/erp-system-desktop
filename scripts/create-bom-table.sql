-- Create BOM calculations table
CREATE TABLE IF NOT EXISTS bom_calculations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    filament_cost_per_kg DECIMAL(10,2) NOT NULL,
    weight_per_unit DECIMAL(10,2) NOT NULL,
    printer_kwh DECIMAL(10,4) NOT NULL,
    electricity_rate DECIMAL(10,4) NOT NULL,
    print_time DECIMAL(10,2) NOT NULL,
    labor_rate DECIMAL(10,2) NOT NULL,
    marketing_percentage DECIMAL(5,2) NOT NULL,
    packaging_cost DECIMAL(10,2) NOT NULL,
    shipping_cost DECIMAL(10,2) NOT NULL,
    platform_fee_percentage DECIMAL(5,2) NOT NULL,
    misc_buffer_percentage DECIMAL(5,2) NOT NULL,
    total_unit_cost DECIMAL(10,2) NOT NULL,
    suggested_sell_price DECIMAL(10,2) NOT NULL,
    profit_margin DECIMAL(5,2) NOT NULL,
    markup_multiplier DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for BOM calculations
CREATE TRIGGER update_bom_calculations_updated_at 
    BEFORE UPDATE ON bom_calculations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_bom_calculations_product_name ON bom_calculations(product_name);
CREATE INDEX idx_bom_calculations_created_at ON bom_calculations(created_at DESC);

-- Enable RLS
ALTER TABLE bom_calculations ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on bom_calculations" ON bom_calculations
    FOR ALL USING (true);
