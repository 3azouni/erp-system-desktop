-- Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    electricity_cost_per_kwh DECIMAL(10,4) NOT NULL DEFAULT 0.12,
    labor_rate_per_hour DECIMAL(10,2) NOT NULL DEFAULT 25.00,
    default_marketing_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    platform_fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 3.00,
    misc_buffer_percentage DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    app_name VARCHAR(255) NOT NULL DEFAULT '3DP Commander',
    app_logo_url TEXT DEFAULT '',
    footer_text TEXT NOT NULL DEFAULT 'Powered by 3DP Commander - 3D Printing Business Management',
    printer_profiles JSONB DEFAULT '[]'::jsonb,
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

-- Create trigger for app_settings
CREATE TRIGGER update_app_settings_updated_at 
    BEFORE UPDATE ON app_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now
CREATE POLICY "Allow all operations on app_settings" ON app_settings
    FOR ALL USING (true);

-- Insert default settings
INSERT INTO app_settings (
    electricity_cost_per_kwh,
    labor_rate_per_hour,
    default_marketing_percentage,
    platform_fee_percentage,
    misc_buffer_percentage,
    currency,
    app_name,
    app_logo_url,
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
    '',
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
) ON CONFLICT DO NOTHING;
