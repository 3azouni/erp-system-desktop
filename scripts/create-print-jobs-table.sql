-- Create print_jobs table
CREATE TABLE IF NOT EXISTS print_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id VARCHAR(50) UNIQUE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    assigned_printer_id UUID REFERENCES printers(id) ON DELETE SET NULL,
    assigned_printer_name VARCHAR(255) NOT NULL,
    estimated_time_hours DECIMAL(10,2) NOT NULL,
    total_estimated_time DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Pending', 'Printing', 'Completed', 'Failed', 'Cancelled')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')) DEFAULT 'Normal',
    customer_name VARCHAR(255),
    due_date DATE,
    notes TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for print_jobs
CREATE TRIGGER update_print_jobs_updated_at 
    BEFORE UPDATE ON print_jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically update printer queue when job status changes
CREATE OR REPLACE FUNCTION update_printer_queue_on_job_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If job is completed, failed, or cancelled, decrease printer queue
    IF NEW.status IN ('Completed', 'Failed', 'Cancelled') AND OLD.status NOT IN ('Completed', 'Failed', 'Cancelled') THEN
        UPDATE printers 
        SET job_queue = GREATEST(job_queue - 1, 0)
        WHERE id = NEW.assigned_printer_id;
    END IF;
    
    -- If job is restarted (moved from completed/failed/cancelled to pending/printing)
    IF OLD.status IN ('Completed', 'Failed', 'Cancelled') AND NEW.status IN ('Pending', 'Printing') THEN
        UPDATE printers 
        SET job_queue = job_queue + 1
        WHERE id = NEW.assigned_printer_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update printer queue
CREATE TRIGGER auto_update_printer_queue
    AFTER UPDATE ON print_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_printer_queue_on_job_change();

-- Create indexes for better performance
CREATE INDEX idx_print_jobs_status ON print_jobs(status);
CREATE INDEX idx_print_jobs_priority ON print_jobs(priority);
CREATE INDEX idx_print_jobs_assigned_printer ON print_jobs(assigned_printer_id);
CREATE INDEX idx_print_jobs_product ON print_jobs(product_id);
CREATE INDEX idx_print_jobs_due_date ON print_jobs(due_date);
CREATE INDEX idx_print_jobs_created_at ON print_jobs(created_at DESC);
CREATE INDEX idx_print_jobs_job_id ON print_jobs(job_id);

-- Enable RLS
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on print_jobs" ON print_jobs
    FOR ALL USING (true);

-- Insert some sample data
INSERT INTO print_jobs (job_id, product_id, product_name, quantity, assigned_printer_id, assigned_printer_name, estimated_time_hours, total_estimated_time, status, priority, customer_name, due_date, started_at, completed_at) VALUES
('JOB-240130-A1B', '1', 'Dragon Miniature', 5, '1', 'Printer 01', 4.5, 22.5, 'Printing', 'Normal', 'John Smith', '2024-02-05', '2024-01-30 09:00:00+00', NULL),
('JOB-240130-C2D', '2', 'Phone Stand', 10, '2', 'Printer 02', 2.0, 20.0, 'Pending', 'High', 'Tech Corp', '2024-02-03', NULL, NULL),
('JOB-240129-E3F', '4', 'Jewelry Pendant', 3, '4', 'Resin Printer 01', 1.5, 4.5, 'Completed', 'Normal', 'Jewelry Store', NULL, '2024-01-29 14:00:00+00', '2024-01-29 18:30:00+00'),
('JOB-240130-G4H', '3', 'Custom Gear', 2, '3', 'Printer 03', 6.5, 13.0, 'Failed', 'Urgent', 'Engineering Co', '2024-02-01', NULL, NULL),
('JOB-240130-I5J', '1', 'Dragon Miniature', 15, '1', 'Printer 01', 4.5, 67.5, 'Pending', 'Low', 'Gaming Store', '2024-02-10', NULL, NULL)
ON CONFLICT (job_id) DO NOTHING;
