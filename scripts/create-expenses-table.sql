-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    date DATE NOT NULL,
    description TEXT NOT NULL,
    vendor VARCHAR(255),
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(expense_type);
CREATE INDEX IF NOT EXISTS idx_expenses_amount ON expenses(amount);

-- Enable Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since no auth required)
CREATE POLICY "Allow all operations on expenses" ON expenses
    FOR ALL USING (true) WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_expenses_updated_at 
    BEFORE UPDATE ON expenses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO expenses (expense_type, amount, date, description, vendor, notes) VALUES
('Material', 245.50, '2024-01-15', 'PETG Filament - Black 1kg', 'Polymaker', 'High quality filament for client orders'),
('Electricity', 89.32, '2024-01-31', 'Monthly electricity bill', 'Power Company', 'Includes 3D printer usage'),
('Software', 29.99, '2024-01-01', 'Fusion 360 Monthly Subscription', 'Autodesk', 'CAD software license'),
('Marketing', 150.00, '2024-01-20', 'Instagram Ad Campaign', 'Meta', 'Promoting custom miniatures'),
('Maintenance', 75.00, '2024-01-25', 'Printer nozzle replacement', 'E3D Online', 'Ender 3 maintenance'),
('Packaging', 45.80, '2024-01-28', 'Shipping boxes and bubble wrap', 'Uline', 'Order packaging supplies'),
('Material', 189.99, '2024-02-05', 'PLA+ Filament - Various Colors', 'eSUN', '3 rolls for upcoming orders'),
('Labor', 320.00, '2024-02-10', 'Design work for custom project', 'Freelancer', '8 hours @ $40/hr'),
('Equipment', 1250.00, '2024-02-15', 'New 3D Printer - Prusa MK4', 'Prusa Research', 'Expanding production capacity'),
('Shipping', 67.45, '2024-02-20', 'Customer order shipping costs', 'FedEx', 'Multiple package shipments'),
('Material', 156.75, '2024-03-01', 'TPU Filament for flexible parts', 'NinjaFlex', 'Specialized flexible material'),
('Software', 99.00, '2024-03-01', 'Simplify3D License', 'Simplify3D', 'Advanced slicing software'),
('Marketing', 200.00, '2024-03-10', 'Trade show booth rental', 'Maker Faire', 'Local maker event participation'),
('Maintenance', 125.50, '2024-03-15', 'Printer bed leveling kit', 'BLTouch', 'Auto-leveling upgrade'),
('Electricity', 95.67, '2024-03-31', 'Monthly electricity  'BLTouch', 'Auto-leveling upgrade'),
('Electricity', 95.67, '2024-03-31', 'Monthly electricity bill', 'Power Company', 'March usage including new printer'),
('Packaging', 38.25, '2024-03-18', 'Custom branded stickers', 'StickerMule', 'Branding for packages'),
('Other', 85.00, '2024-03-22', 'Business insurance premium', 'State Farm', 'Monthly business coverage'),
('Material', 278.90, '2024-04-02', 'Wood PLA and Metal Fill', 'Proto-pasta', 'Specialty filaments for art pieces'),
('Labor', 480.00, '2024-04-08', 'CAD modeling services', 'Design Studio', '12 hours of professional modeling'),
('Marketing', 75.00, '2024-04-12', 'Business cards printing', 'Vistaprint', '500 premium business cards'),
('Maintenance', 45.99, '2024-04-18', 'Printer cleaning supplies', 'Amazon', 'Isopropyl alcohol and tools'),
('Software', 19.99, '2024-04-01', 'Cloud storage upgrade', 'Google Drive', 'Additional storage for designs'),
('Shipping', 89.34, '2024-04-25', 'International shipping costs', 'DHL', 'Orders to Canada and UK');
