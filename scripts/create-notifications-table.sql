-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Add foreign key constraint if users table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE notifications 
        ADD CONSTRAINT fk_notifications_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Insert sample notifications for testing
INSERT INTO notifications (user_id, title, message, type, read) VALUES
    ((SELECT id FROM users LIMIT 1), 'Low Inventory Alert', 'PETG-CF filament is running low (15g remaining)', 'warning', false),
    ((SELECT id FROM users LIMIT 1), 'Print Job Completed', 'Custom Phone Case #12345 has finished printing', 'success', false),
    ((SELECT id FROM users LIMIT 1), 'New Order Received', 'Order #ORD-2024-001 from John Smith received', 'info', true),
    ((SELECT id FROM users LIMIT 1), 'Printer Maintenance Due', 'Printer A1 Mini is due for maintenance', 'warning', false),
    ((SELECT id FROM users LIMIT 1), 'Monthly Report Ready', 'Your January production report is ready for review', 'info', true);
