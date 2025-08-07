-- Drop existing expenses table if it exists
DROP TABLE IF EXISTS expenses CASCADE;

-- Create expenses table with correct structure
CREATE TABLE expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_name VARCHAR(255) NOT NULL,
    expense_type VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for expenses
CREATE TRIGGER update_expenses_updated_at 
    BEFORE UPDATE ON expenses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_expenses_type ON expenses(expense_type);
CREATE INDEX idx_expenses_date ON expenses(date DESC);
CREATE INDEX idx_expenses_created_at ON expenses(created_at DESC);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now
CREATE POLICY "Allow all operations on expenses" ON expenses
    FOR ALL USING (true);

-- Insert sample data
INSERT INTO expenses (expense_name, expense_type, amount, date, notes) VALUES
('PLA Filament - 5kg', 'Filament Purchase', 125.99, '2024-01-15', 'Bulk purchase from Hatchbox'),
('Electricity Bill', 'Electricity', 89.45, '2024-01-01', 'Monthly electricity cost'),
('Instagram Ads', 'Marketing', 150.00, '2024-01-10', 'Social media advertising campaign'),
('Nozzle Replacement Kit', 'Maintenance', 25.50, '2024-01-12', 'Replacement nozzles for Ender 3'),
('Shopify Subscription', 'Software', 29.00, '2024-01-01', 'Monthly e-commerce platform fee'),
('PETG Filament - 2kg', 'Filament Purchase', 89.99, '2024-01-20', 'Clear PETG for transparent parts'),
('Google Ads', 'Marketing', 200.00, '2024-01-18', 'Search advertising campaign'),
('Build Plate Replacement', 'Maintenance', 35.00, '2024-01-22', 'Glass build plate for Prusa'),
('Packaging Materials', 'Labor', 45.75, '2024-01-25', 'Boxes and bubble wrap for shipping')
ON CONFLICT DO NOTHING;
