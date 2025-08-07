-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    department VARCHAR(100) NOT NULL DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    module VARCHAR(100) NOT NULL,
    can_view BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, module)
);

-- Insert default admin user
INSERT INTO users (email, password_hash, full_name, role, department, is_active)
VALUES ('admin@3dpcommander.com', 'admin123_simple_hash', 'System Administrator', 'admin', 'general', true)
ON CONFLICT (email) DO NOTHING;

-- Get the admin user ID and insert permissions
DO $$
DECLARE
    admin_user_id UUID;
    module_name TEXT;
    modules TEXT[] := ARRAY['dashboard', 'products', 'orders', 'inventory', 'printers', 'scheduler', 'bom', 'expenses', 'analytics', 'settings'];
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@3dpcommander.com';
    
    -- Insert permissions for each module
    FOREACH module_name IN ARRAY modules
    LOOP
        INSERT INTO user_permissions (user_id, module, can_view, can_create, can_edit, can_delete)
        VALUES (admin_user_id, module_name, true, true, true, true)
        ON CONFLICT (user_id, module) DO NOTHING;
    END LOOP;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
