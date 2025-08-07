const sqlite3 = require('sqlite3')
const path = require('path')
const fs = require('fs')
const bcrypt = require('bcryptjs')

// Database file path in user's documents folder
const getDbPath = () => {
  const userDocuments = path.join(process.env.USERPROFILE || '', 'Documents')
  const appFolder = path.join(userDocuments, '3DP Commander')
  
  // Create app folder if it doesn't exist
  if (!fs.existsSync(appFolder)) {
    fs.mkdirSync(appFolder, { recursive: true })
  }
  
  return path.join(appFolder, '3dp-commander.db')
}

let db = null

const getDatabase = () => {
  if (!db) {
    const dbPath = getDbPath()
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err)
      } else {
        console.log('Connected to local SQLite database')
      }
    })
  }
  return db
}

const initializeDatabase = async () => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    
    // Enable foreign keys
    database.run('PRAGMA foreign_keys = ON')
    
    // Create tables
    const createTables = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'viewer',
        department TEXT NOT NULL DEFAULT 'general',
        is_active BOOLEAN DEFAULT 1,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_name TEXT NOT NULL,
        sku TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        required_materials TEXT DEFAULT '[]',
        print_time REAL NOT NULL DEFAULT 0,
        weight INTEGER NOT NULL DEFAULT 0,
        printer_type TEXT NOT NULL,
        image_url TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        material_name TEXT NOT NULL,
        material_type TEXT NOT NULL,
        color TEXT NOT NULL,
        price_per_kg REAL NOT NULL DEFAULT 0,
        quantity_available INTEGER NOT NULL DEFAULT 0,
        supplier TEXT NOT NULL,
        minimum_threshold INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'Normal',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS printers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        printer_name TEXT NOT NULL,
        model TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Idle',
        power_consumption REAL NOT NULL DEFAULT 0,
        hours_printed REAL NOT NULL DEFAULT 0,
        last_maintenance_date DATE NOT NULL DEFAULT CURRENT_DATE,
        job_queue INTEGER NOT NULL DEFAULT 0,
        location TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT UNIQUE NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT,
        customer_phone TEXT,
        source TEXT NOT NULL,
        ordered_products TEXT NOT NULL DEFAULT '[]',
        total_quantity INTEGER NOT NULL DEFAULT 0,
        total_amount REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'New',
        tracking_number TEXT,
        shipping_address TEXT,
        notes TEXT,
        order_date DATE NOT NULL DEFAULT CURRENT_DATE,
        shipped_date DATE,
        delivered_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expense_type TEXT NOT NULL,
        amount REAL NOT NULL,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        description TEXT NOT NULL,
        vendor TEXT,
        receipt_url TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS print_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        printer_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        estimated_print_time REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'Queued',
        started_at DATETIME,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        electricity_cost_per_kwh REAL NOT NULL DEFAULT 0.12,
        labor_rate_per_hour REAL NOT NULL DEFAULT 25.00,
        default_marketing_percentage REAL NOT NULL DEFAULT 10.00,
        platform_fee_percentage REAL NOT NULL DEFAULT 5.00,
        misc_buffer_percentage REAL NOT NULL DEFAULT 5.00,
        currency TEXT NOT NULL DEFAULT 'USD',
        app_name TEXT NOT NULL DEFAULT '3DP Commander',
        app_logo_url TEXT,
        footer_text TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `

    database.exec(createTables, (err) => {
      if (err) {
        console.error('Error creating tables:', err)
        reject(err)
      } else {
        console.log('Database tables created successfully')
        insertDefaultData().then(resolve).catch(reject)
      }
    })
  })
}

const insertDefaultData = async () => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    
    // Check if admin user exists
    database.get('SELECT id FROM users WHERE email = ?', ['admin@3dpcommander.com'], async (err, row) => {
      if (err) {
        reject(err)
        return
      }
      
      if (!row) {
        // Create default admin user
        const hashedPassword = await bcrypt.hash('admin123', 12)
        
        database.run(
          'INSERT INTO users (email, password_hash, full_name, role, department, is_active) VALUES (?, ?, ?, ?, ?, ?)',
          ['admin@3dpcommander.com', hashedPassword, 'System Administrator', 'admin', 'general', 1],
          function(err) {
            if (err) {
              reject(err)
              return
            }
            
            console.log('Default admin user created')
            
            // Insert sample products
            const sampleProducts = [
              {
                product_name: 'Phone Stand',
                sku: 'PS-001',
                category: 'Functional Parts',
                required_materials: JSON.stringify(['PLA', 'Black']),
                print_time: 2.5,
                weight: 150,
                printer_type: 'FDM',
                description: 'Adjustable phone stand for desk use'
              },
              {
                product_name: 'Miniature Figurine',
                sku: 'MF-001',
                category: 'Miniatures',
                required_materials: JSON.stringify(['Resin', 'Gray']),
                print_time: 4.0,
                weight: 50,
                printer_type: 'SLA',
                description: 'Detailed miniature figurine for tabletop games'
              },
              {
                product_name: 'Cable Organizer',
                sku: 'CO-001',
                category: 'Tools & Accessories',
                required_materials: JSON.stringify(['PLA', 'White']),
                print_time: 1.5,
                weight: 75,
                printer_type: 'FDM',
                description: 'Cable management organizer for desk setup'
              }
            ]
            
            // Insert sample products
            sampleProducts.forEach((product, index) => {
              database.run(
                `INSERT INTO products (product_name, sku, category, required_materials, print_time, weight, printer_type, description, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                [product.product_name, product.sku, product.category, product.required_materials, product.print_time, product.weight, product.printer_type, product.description],
                function(err) {
                  if (err) {
                    console.error('Error inserting sample product:', err)
                  } else {
                    console.log(`Sample product ${index + 1} created: ${product.product_name}`)
                  }
                }
              )
            })
            
            // Insert sample printers
            const samplePrinters = [
              {
                printer_name: 'Creality Ender 3',
                model: 'Ender 3',
                status: 'Idle',
                power_consumption: 0.3,
                hours_printed: 120,
                last_maintenance_date: '2024-01-01',
                job_queue: 0,
                location: 'Workshop A',
                notes: 'Primary FDM printer'
              },
              {
                printer_name: 'Elegoo Mars 3',
                model: 'Mars 3',
                status: 'Idle',
                power_consumption: 0.2,
                hours_printed: 80,
                last_maintenance_date: '2024-01-15',
                job_queue: 0,
                location: 'Workshop B',
                notes: 'Resin printer for detailed prints'
              }
            ]
            
            // Insert sample printers
            samplePrinters.forEach((printer, index) => {
              database.run(
                `INSERT INTO printers (printer_name, model, status, power_consumption, hours_printed, last_maintenance_date, job_queue, location, notes, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                [printer.printer_name, printer.model, printer.status, printer.power_consumption, printer.hours_printed, printer.last_maintenance_date, printer.job_queue, printer.location, printer.notes],
                function(err) {
                  if (err) {
                    console.error('Error inserting sample printer:', err)
                  } else {
                    console.log(`Sample printer ${index + 1} created: ${printer.printer_name}`)
                  }
                }
              )
            })
            
            resolve()
          }
        )
      } else {
        resolve()
      }
    })
  })
}

const closeDatabase = () => {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err)
      } else {
        console.log('Database connection closed')
      }
    })
    db = null
  }
}

async function setupDatabase() {
  try {
    console.log('🚀 Setting up local SQLite database...')
    
    await initializeDatabase()
    
    console.log('✅ Database setup completed successfully!')
    console.log('📁 Database location: Documents/3DP Commander/3dp-commander.db')
    console.log('')
    console.log('🔑 Default login credentials:')
    console.log('   Email: admin@3dpcommander.com')
    console.log('   Password: admin123')
    console.log('')
    console.log('🎉 You can now run the application!')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  } finally {
    closeDatabase()
  }
}

// Run the setup
setupDatabase() 