-- Drop existing print_jobs table if it exists and recreate with correct structure
DROP TABLE IF EXISTS print_jobs CASCADE;

-- Create print_jobs table with correct structure
CREATE TABLE print_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id VARCHAR(50) UNIQUE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    assigned_printer_id UUID REFERENCES printers(id) ON DELETE SET NULL,
    assigned_printer_name VARCHAR(255) NOT NULL,
    estimated_time_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_estimated_time DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Pending', 'Printing', 'Completed', 'Failed', 'Cancelled')) DEFAULT 'Pending',
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')) DEFAULT 'Normal',
    customer_name VARCHAR(255),
    due_date DATE,
    notes TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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

-- Insert some sample data (only if products and printers exist)
DO $$
BEGIN
    -- Check if we have products and printers before inserting sample jobs
    IF EXISTS (SELECT 1 FROM products LIMIT 1) AND EXISTS (SELECT 1 FROM printers LIMIT 1) THEN
        INSERT INTO print_jobs (
            job_id, 
            product_id, 
            product_name, 
            quantity, 
            assigned_printer_id, 
            assigned_printer_name, 
            estimated_time_hours, 
            total_estimated_time, 
            status, 
            priority, 
            customer_name, 
            due_date
        ) 
        SELECT 
            'JOB-' || EXTRACT(EPOCH FROM NOW())::bigint || '-' || UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 3)),
            p.id,
            p.product_name,
            FLOOR(RANDOM() * 5 + 1)::integer,
            pr.id,
            pr.printer_name,
            p.print_time,
            p.print_time * FLOOR(RANDOM() * 5 + 1)::integer,
            CASE FLOOR(RANDOM() * 4)
                WHEN 0 THEN 'Pending'
                WHEN 1 THEN 'Printing'
                WHEN 2 THEN 'Completed'
                ELSE 'Failed'
            END,
            CASE FLOOR(RANDOM() * 4)
                WHEN 0 THEN 'Low'
                WHEN 1 THEN 'Normal'
                WHEN 2 THEN 'High'
                ELSE 'Urgent'
            END,
            CASE FLOOR(RANDOM() * 3)
                WHEN 0 THEN 'John Smith'
                WHEN 1 THEN 'Jane Doe'
                ELSE NULL
            END,
            CURRENT_DATE + INTERVAL '1 day' * FLOOR(RANDOM() * 30)
        FROM 
            (SELECT * FROM products ORDER BY RANDOM() LIMIT 3) p
        CROSS JOIN 
            (SELECT * FROM printers ORDER BY RANDOM() LIMIT 1) pr
        ON CONFLICT (job_id) DO NOTHING;
    END IF;
END $$;
