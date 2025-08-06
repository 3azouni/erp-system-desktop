const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// Database path
const dbPath = path.join(process.env.USERPROFILE || process.env.HOME, 'Documents', '3DP Commander', '3dp-commander.db')

console.log('🚀 Creating components tables...')
console.log(`📁 Database location: ${dbPath}`)

const db = new sqlite3.Database(dbPath)

db.serialize(() => {
  // Create components table
  db.run(`
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
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating components table:', err.message)
    } else {
      console.log('✅ Components table created successfully')
    }
  })

  // Create component_inventory table
  db.run(`
    CREATE TABLE IF NOT EXISTS component_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      component_id INTEGER NOT NULL,
      current_stock INTEGER DEFAULT 0,
      reserved_stock INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating component_inventory table:', err.message)
    } else {
      console.log('✅ Component inventory table created successfully')
    }
  })

  // Create component_orders table
  db.run(`
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
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating component_orders table:', err.message)
    } else {
      console.log('✅ Component orders table created successfully')
    }
  })

  // Create printer_components table
  db.run(`
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
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating printer_components table:', err.message)
    } else {
      console.log('✅ Printer components table created successfully')
    }
  })

  // Create indexes
  db.run('CREATE INDEX IF NOT EXISTS idx_components_category ON components(category)', (err) => {
    if (err) {
      console.error('❌ Error creating category index:', err.message)
    } else {
      console.log('✅ Category index created successfully')
    }
  })

  db.run('CREATE INDEX IF NOT EXISTS idx_components_supplier ON components(supplier)', (err) => {
    if (err) {
      console.error('❌ Error creating supplier index:', err.message)
    } else {
      console.log('✅ Supplier index created successfully')
    }
  })

  db.run('CREATE INDEX IF NOT EXISTS idx_component_inventory_component_id ON component_inventory(component_id)', (err) => {
    if (err) {
      console.error('❌ Error creating inventory index:', err.message)
    } else {
      console.log('✅ Inventory index created successfully')
    }
  })

  db.run('CREATE INDEX IF NOT EXISTS idx_component_orders_component_id ON component_orders(component_id)', (err) => {
    if (err) {
      console.error('❌ Error creating orders index:', err.message)
    } else {
      console.log('✅ Orders index created successfully')
    }
  })

  db.run('CREATE INDEX IF NOT EXISTS idx_component_orders_status ON component_orders(status)', (err) => {
    if (err) {
      console.error('❌ Error creating status index:', err.message)
    } else {
      console.log('✅ Status index created successfully')
    }
  })

  db.run('CREATE INDEX IF NOT EXISTS idx_printer_components_printer_id ON printer_components(printer_id)', (err) => {
    if (err) {
      console.error('❌ Error creating printer components index:', err.message)
    } else {
      console.log('✅ Printer components index created successfully')
    }
  })

  db.run('CREATE INDEX IF NOT EXISTS idx_printer_components_component_id ON printer_components(component_id)', (err) => {
    if (err) {
      console.error('❌ Error creating component printer index:', err.message)
    } else {
      console.log('✅ Component printer index created successfully')
    }
  })

  db.run('CREATE INDEX IF NOT EXISTS idx_printer_components_status ON printer_components(status)', (err) => {
    if (err) {
      console.error('❌ Error creating printer status index:', err.message)
    } else {
      console.log('✅ Printer status index created successfully')
    }
  })

  // Close database after all operations
  setTimeout(() => {
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message)
      } else {
        console.log('✅ Database connection closed')
        console.log('🎉 Components tables setup completed successfully!')
      }
    })
  }, 1000)
}) 