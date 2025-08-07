-- Create components table
CREATE TABLE IF NOT EXISTS components (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    component_name TEXT NOT NULL,
    description TEXT,
    part_number TEXT,
    category TEXT NOT NULL,
    cost REAL NOT NULL DEFAULT 0,
    supplier TEXT,
    minimum_stock_level INTEGER DEFAULT 0,
    serial_number_tracking BOOLEAN DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Create component_inventory table
CREATE TABLE IF NOT EXISTS component_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    component_id INTEGER NOT NULL,
    current_stock INTEGER DEFAULT 0,
    reserved_stock INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE CASCADE
);

-- Create component_orders table
CREATE TABLE IF NOT EXISTS component_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    component_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'Ordered',
    order_date TEXT NOT NULL,
    expected_delivery TEXT,
    actual_delivery TEXT,
    shipping_vendor TEXT,
    tracking_number TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE CASCADE
);

-- Create printer_components table
CREATE TABLE IF NOT EXISTS printer_components (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    printer_id INTEGER NOT NULL,
    component_id INTEGER NOT NULL,
    installation_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    serial_number TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (printer_id) REFERENCES printers(id) ON DELETE CASCADE,
    FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_components_category ON components(category);
CREATE INDEX IF NOT EXISTS idx_components_supplier ON components(supplier);
CREATE INDEX IF NOT EXISTS idx_component_inventory_component_id ON component_inventory(component_id);
CREATE INDEX IF NOT EXISTS idx_component_orders_component_id ON component_orders(component_id);
CREATE INDEX IF NOT EXISTS idx_component_orders_status ON component_orders(status);
CREATE INDEX IF NOT EXISTS idx_printer_components_printer_id ON printer_components(printer_id);
CREATE INDEX IF NOT EXISTS idx_printer_components_component_id ON printer_components(component_id);
CREATE INDEX IF NOT EXISTS idx_printer_components_status ON printer_components(status); 