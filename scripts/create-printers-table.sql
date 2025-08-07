-- Create printers table
CREATE TABLE IF NOT EXISTS printers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    printer_name VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Idle', 'Printing', 'Maintenance', 'Offline')),
    power_consumption DECIMAL(10,2) NOT NULL,
    hours_printed DECIMAL(10,2) NOT NULL DEFAULT 0,
    last_maintenance_date DATE NOT NULL,
    job_queue INTEGER NOT NULL DEFAULT 0,
    current_job VARCHAR(255),
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for printers
CREATE TRIGGER update_printers_updated_at 
    BEFORE UPDATE ON printers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_printers_status ON printers(status);
CREATE INDEX idx_printers_model ON printers(model);
CREATE INDEX idx_printers_location ON printers(location);
CREATE INDEX idx_printers_created_at ON printers(created_at DESC);

-- Enable RLS
ALTER TABLE printers ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on printers" ON printers
    FOR ALL USING (true);

-- Insert some sample data
INSERT INTO printers (printer_name, model, status, power_consumption, hours_printed, last_maintenance_date, job_queue, current_job, location, notes) VALUES
('Printer 01', 'Prusa i3 MK3S+', 'Printing', 250.0, 1247.5, '2024-01-15', 3, 'Dragon Miniature #1234', 'Workshop A', NULL),
('Printer 02', 'Ender 3 V2', 'Idle', 220.0, 892.3, '2024-01-20', 1, NULL, 'Workshop A', NULL),
('Printer 03', 'Bambu Lab X1 Carbon', 'Maintenance', 350.0, 2156.8, '2024-01-10', 0, NULL, 'Workshop B', 'Hotend replacement needed'),
('Resin Printer 01', 'Formlabs Form 3', 'Printing', 180.0, 456.2, '2024-01-25', 2, 'Jewelry Pendant #5678', 'Resin Station', NULL),
('Printer 04', 'Ultimaker S3', 'Offline', 280.0, 1834.7, '2024-01-05', 0, NULL, 'Workshop B', 'Network connectivity issues')
ON CONFLICT DO NOTHING;
