-- Fix app_settings table to use UUID primary key
-- Drop existing table if it exists
DROP TABLE IF EXISTS app_settings CASCADE;

-- Create app_settings table with proper UUID primary key
CREATE TABLE app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    electricity_cost_per_kwh DECIMAL(10,4) NOT NULL DEFAULT 0.12,
    labor_rate_per_hour DECIMAL(10,2) NOT NULL DEFAULT 25.00,
    default_marketing_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    platform_fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 3.00,
    misc_buffer_percentage DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    app_name VARCHAR(255) NOT NULL DEFAULT '3DP Commander',
    app_logo_url TEXT,
    footer_text TEXT DEFAULT 'Powered by 3DP Commander - 3D Printing Business Management',
    printer_profiles JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_app_settings_updated_at 
    BEFORE UPDATE ON app_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO app_settings (
    electricity_cost_per_kwh,
    labor_rate_per_hour,
    default_marketing_percentage,
    platform_fee_percentage,
    misc_buffer_percentage,
    currency,
    app_name,
    footer_text,
    printer_profiles
) VALUES (
    0.12,
    25.00,
    10.00,
    3.00,
    5.00,
    'USD',
    '3DP Commander',
    'Powered by 3DP Commander - 3D Printing Business Management',
    '[
        {
            "id": "ender3-pro",
            "name": "Ender 3 Pro",
            "power_draw_watts": 220,
            "default_print_speed": 50
        },
        {
            "id": "prusa-mk3s",
            "name": "Prusa i3 MK3S+",
            "power_draw_watts": 120,
            "default_print_speed": 60
        }
    ]'::jsonb
);

-- Create index for better performance
CREATE INDEX idx_app_settings_created_at ON app_settings(created_at);

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON app_settings TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE app_settings_id_seq TO your_app_user;

-- Verify the table was created successfully
SELECT 
    id,
    electricity_cost_per_kwh,
    labor_rate_per_hour,
    currency,
    app_name,
    created_at
FROM app_settings;
