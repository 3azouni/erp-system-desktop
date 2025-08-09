-- =====================================================
-- Events Table for Analytics Tracking
-- =====================================================

-- Create events table for analytics
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_entity ON events(entity);
CREATE INDEX IF NOT EXISTS idx_events_entity_id ON events(entity_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_type_created_at ON events(type, created_at);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events table
-- Only authenticated users can insert their own events
CREATE POLICY "Users can insert their own events" ON events
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Only admins can read all events
CREATE POLICY "Admins can read all events" ON events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Only admins can update events
CREATE POLICY "Admins can update events" ON events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Only admins can delete events
CREATE POLICY "Admins can delete events" ON events
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at column if it doesn't exist
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE events IS 'Analytics events table for tracking user actions';
COMMENT ON COLUMN events.id IS 'Unique event identifier';
COMMENT ON COLUMN events.user_id IS 'User who triggered the event';
COMMENT ON COLUMN events.type IS 'Event type (e.g., barcode_generated, sku_generated)';
COMMENT ON COLUMN events.entity IS 'Entity type (e.g., product, order, inventory)';
COMMENT ON COLUMN events.entity_id IS 'ID of the related entity';
COMMENT ON COLUMN events.created_at IS 'When the event occurred';
COMMENT ON COLUMN events.metadata IS 'Additional event data as JSON';
COMMENT ON COLUMN events.updated_at IS 'When the event was last updated';
