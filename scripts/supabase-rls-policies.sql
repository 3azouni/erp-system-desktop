-- =====================================================
-- Supabase RLS Policies for 3DP Commander
-- =====================================================

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE printers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE finished_goods_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_calculations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Admins can read all users
CREATE POLICY "Admins can read all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Admins can insert/update/delete all users
CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- =====================================================
-- PRODUCTS TABLE POLICIES
-- =====================================================

-- All authenticated users can read products
CREATE POLICY "Authenticated users can read products" ON products
    FOR SELECT USING (auth.role() = 'authenticated');

-- Admins and managers can insert products
CREATE POLICY "Admins and managers can insert products" ON products
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'manager')
        )
    );

-- Admins and managers can update products
CREATE POLICY "Admins and managers can update products" ON products
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'manager')
        )
    );

-- Admins can delete products
CREATE POLICY "Admins can delete products" ON products
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- =====================================================
-- INVENTORY TABLE POLICIES
-- =====================================================

-- All authenticated users can read inventory
CREATE POLICY "Authenticated users can read inventory" ON inventory
    FOR SELECT USING (auth.role() = 'authenticated');

-- Admins and managers can insert inventory
CREATE POLICY "Admins and managers can insert inventory" ON inventory
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'manager')
        )
    );

-- Admins and managers can update inventory
CREATE POLICY "Admins and managers can update inventory" ON inventory
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'manager')
        )
    );

-- Admins can delete inventory
CREATE POLICY "Admins can delete inventory" ON inventory
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- =====================================================
-- PRINTERS TABLE POLICIES
-- =====================================================

-- All authenticated users can read printers
CREATE POLICY "Authenticated users can read printers" ON printers
    FOR SELECT USING (auth.role() = 'authenticated');

-- Admins and managers can insert printers
CREATE POLICY "Admins and managers can insert printers" ON printers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'manager')
        )
    );

-- Admins and managers can update printers
CREATE POLICY "Admins and managers can update printers" ON printers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'manager')
        )
    );

-- Admins can delete printers
CREATE POLICY "Admins can delete printers" ON printers
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- =====================================================
-- ORDERS TABLE POLICIES
-- =====================================================

-- All authenticated users can read orders
CREATE POLICY "Authenticated users can read orders" ON orders
    FOR SELECT USING (auth.role() = 'authenticated');

-- Admins and managers can insert orders
CREATE POLICY "Admins and managers can insert orders" ON orders
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'manager')
        )
    );

-- Admins and managers can update orders
CREATE POLICY "Admins and managers can update orders" ON orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'manager')
        )
    );

-- Admins can delete orders
CREATE POLICY "Admins can delete orders" ON orders
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- =====================================================
-- EXPENSES TABLE POLICIES
-- =====================================================

-- All authenticated users can read expenses
CREATE POLICY "Authenticated users can read expenses" ON expenses
    FOR SELECT USING (auth.role() = 'authenticated');

-- Admins and managers can insert expenses
CREATE POLICY "Admins and managers can insert expenses" ON expenses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'manager')
        )
    );

-- Admins and managers can update expenses
CREATE POLICY "Admins and managers can update expenses" ON expenses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'manager')
        )
    );

-- Admins can delete expenses
CREATE POLICY "Admins can delete expenses" ON expenses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- =====================================================
-- PRINT_JOBS TABLE POLICIES
-- =====================================================

-- All authenticated users can read print jobs
CREATE POLICY "Authenticated users can read print jobs" ON print_jobs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Admins and managers can insert print jobs
CREATE POLICY "Admins and managers can insert print jobs" ON print_jobs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'manager')
        )
    );

-- Admins and managers can update print jobs
CREATE POLICY "Admins and managers can update print jobs" ON print_jobs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'manager')
        )
    );

-- Admins can delete print jobs
CREATE POLICY "Admins can delete print jobs" ON print_jobs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- =====================================================
-- APP_SETTINGS TABLE POLICIES
-- =====================================================

-- All authenticated users can read app settings
CREATE POLICY "Authenticated users can read app settings" ON app_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can modify app settings
CREATE POLICY "Admins can manage app settings" ON app_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- =====================================================
-- NOTIFICATIONS TABLE POLICIES
-- =====================================================

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications" ON notifications
    FOR SELECT USING (user_id::text = auth.uid()::text);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id::text = auth.uid()::text);

-- Admins can read all notifications
CREATE POLICY "Admins can read all notifications" ON notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Admins can insert/delete all notifications
CREATE POLICY "Admins can manage all notifications" ON notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- =====================================================
-- COMPONENTS TABLE POLICIES
-- =====================================================

-- All authenticated users can read components
CREATE POLICY "Authenticated users can read components" ON components
    FOR SELECT USING (auth.role() = 'authenticated');

-- Admins and managers can insert components
CREATE POLICY "Admins and managers can insert components" ON components
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'manager')
        )
    );

-- Admins and managers can update components
CREATE POLICY "Admins and managers can update components" ON components
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'manager')
        )
    );

-- Admins can delete components
CREATE POLICY "Admins can delete components" ON components
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- =====================================================
-- COMPONENT_INVENTORY TABLE POLICIES
-- =====================================================

-- All authenticated users can read component inventory
CREATE POLICY "Authenticated users can read component inventory" ON component_inventory
    FOR SELECT USING (auth.role() = 'authenticated');

-- Admins and managers can insert component inventory
CREATE POLICY "Admins and managers can insert component inventory" ON component_inventory
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'manager')
        )
    );

-- Admins and managers can update component inventory
CREATE POLICY "Admins and managers can update component inventory" ON component_inventory
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'manager')
        )
    );

-- Admins can delete component inventory
CREATE POLICY "Admins can delete component inventory" ON component_inventory
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- =====================================================
-- FINISHED_GOODS_INVENTORY TABLE POLICIES
-- =====================================================

-- All authenticated users can read finished goods inventory
CREATE POLICY "Authenticated users can read finished goods inventory" ON finished_goods_inventory
    FOR SELECT USING (auth.role() = 'authenticated');

-- Admins and managers can insert finished goods inventory
CREATE POLICY "Admins and managers can insert finished goods inventory" ON finished_goods_inventory
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'manager')
        )
    );

-- Admins and managers can update finished goods inventory
CREATE POLICY "Admins and managers can update finished goods inventory" ON finished_goods_inventory
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'manager')
        )
    );

-- Admins can delete finished goods inventory
CREATE POLICY "Admins can delete finished goods inventory" ON finished_goods_inventory
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- =====================================================
-- USER_NOTIFICATION_PREFERENCES TABLE POLICIES
-- =====================================================

-- Users can read their own notification preferences
CREATE POLICY "Users can read own notification preferences" ON user_notification_preferences
    FOR SELECT USING (user_id::text = auth.uid()::text);

-- Users can update their own notification preferences
CREATE POLICY "Users can update own notification preferences" ON user_notification_preferences
    FOR UPDATE USING (user_id::text = auth.uid()::text);

-- Users can insert their own notification preferences
CREATE POLICY "Users can insert own notification preferences" ON user_notification_preferences
    FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

-- Admins can read all notification preferences
CREATE POLICY "Admins can read all notification preferences" ON user_notification_preferences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- =====================================================
-- BOM_CALCULATIONS TABLE POLICIES
-- =====================================================

-- All authenticated users can read BOM calculations
CREATE POLICY "Authenticated users can read BOM calculations" ON bom_calculations
    FOR SELECT USING (auth.role() = 'authenticated');

-- Admins and managers can insert BOM calculations
CREATE POLICY "Admins and managers can insert BOM calculations" ON bom_calculations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'manager')
        )
    );

-- Admins and managers can update BOM calculations
CREATE POLICY "Admins and managers can update BOM calculations" ON bom_calculations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'manager')
        )
    );

-- Admins can delete BOM calculations
CREATE POLICY "Admins can delete BOM calculations" ON bom_calculations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );
