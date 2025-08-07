import sqlite3 from 'sqlite3'
import path from 'path'
import fs from 'fs'
import bcrypt from 'bcryptjs'

// Add type declaration for global object
declare global {
  var db: sqlite3.Database | null
  var dbInitialized: boolean
  var dbConnected: boolean
  var tablesCreatedLogged: boolean
  var migrationLogged: boolean
  var availabilityService: any
}

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

let db: sqlite3.Database | null = null

export const getDatabase = (): sqlite3.Database => {
  if (!db) {
    const dbPath = getDbPath()
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err)
      } else {
        // Only log connection once per session
        if (!global.dbConnected) {
          console.log('Connected to local SQLite database')
          global.dbConnected = true
        }
      }
    })
  }
  return db
}

// Use a more persistent flag that survives module reloads
if (!global.dbInitialized) {
  global.dbInitialized = false
}

let initializationPromise: Promise<void> | null = null

export const initializeDatabase = async (): Promise<void> => {
  if (global.dbInitialized) {
    return Promise.resolve()
  }
  
  // If initialization is already in progress, wait for it
  if (initializationPromise) {
    return initializationPromise
  }
  
  initializationPromise = new Promise((resolve, reject) => {
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
        phone TEXT,
        bio TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        zip TEXT,
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
        status TEXT NOT NULL DEFAULT 'Pending',
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
         printer_profiles TEXT DEFAULT '[]',
         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
         updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
       );

       CREATE TABLE IF NOT EXISTS user_notification_preferences (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         user_id INTEGER NOT NULL,
         email_notifications BOOLEAN DEFAULT 1,
         push_notifications BOOLEAN DEFAULT 1,
         sms_notifications BOOLEAN DEFAULT 0,
         marketing_emails BOOLEAN DEFAULT 0,
         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
         updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
         FOREIGN KEY (user_id) REFERENCES users (id)
       );

             CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'info',
        read BOOLEAN DEFAULT 0,
        data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS components (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        component_name TEXT NOT NULL,
        description TEXT,
        part_number TEXT UNIQUE,
        category TEXT NOT NULL,
        cost REAL NOT NULL DEFAULT 0,
        supplier TEXT,
        minimum_stock_level INTEGER NOT NULL DEFAULT 0,
        serial_number_tracking BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS component_inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        component_id INTEGER NOT NULL,
        current_stock INTEGER NOT NULL DEFAULT 0,
        reserved_stock INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS finished_goods_inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        quantity_available INTEGER NOT NULL DEFAULT 0,
        reserved_quantity INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `

    database.exec(createTables, (err) => {
             if (err) {
         console.error('Error creating tables:', err)
         initializationPromise = null
         reject(err)
       } else {
         // Only log once per session
         if (!global.tablesCreatedLogged) {
           console.log('Database tables created successfully')
           global.tablesCreatedLogged = true
         }
                 // Run migrations
         runMigrations().then(() => {
           insertDefaultData().then(() => {
             // Clear availability cache when database is initialized
             if (global.availabilityService) {
               global.availabilityService.clearCache()
             }
             global.dbInitialized = true
             initializationPromise = null
             resolve()
           }).catch((error) => {
             initializationPromise = null
             reject(error)
           })
         }).catch((error) => {
           initializationPromise = null
           reject(error)
         })
      }
    })
  })
}

const runMigrations = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    
    // Check if printer_profiles column exists in app_settings table
    database.all("PRAGMA table_info(app_settings)", (err, columns) => {
      if (err) {
        reject(err)
        return
      }
      
      const hasPrinterProfiles = columns.some((col: any) => col.name === 'printer_profiles')
      
      if (!hasPrinterProfiles) {
        console.log('Adding printer_profiles column to app_settings table...')
        database.run('ALTER TABLE app_settings ADD COLUMN printer_profiles TEXT DEFAULT "[]"', (err) => {
          if (err) {
            console.error('Error adding printer_profiles column:', err)
            reject(err)
          } else {
            console.log('printer_profiles column added successfully')
            resolve()
          }
        })
      } else {
        // Only log once per process to reduce noise
        if (!global.migrationLogged) {
          global.migrationLogged = true
        }
        resolve()
      }
    })
  })
}

const insertDefaultData = async (): Promise<void> => {
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
            
            // Create default app settings with printer profiles
            const defaultPrinterProfiles = JSON.stringify([
              {
                id: "ender3-pro",
                name: "Ender 3 Pro",
                power_draw_watts: 220,
                default_print_speed: 50
              },
              {
                id: "prusa-mk3s",
                name: "Prusa i3 MK3S+",
                power_draw_watts: 120,
                default_print_speed: 60
              }
            ])
            
            database.run(
              'INSERT INTO app_settings (electricity_cost_per_kwh, labor_rate_per_hour, default_marketing_percentage, platform_fee_percentage, misc_buffer_percentage, currency, app_name, footer_text, printer_profiles) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [0.12, 25.0, 10.0, 5.0, 5.0, 'USD', '3DP Commander', 'Powered by 3DP Commander - 3D Printing Business Management', defaultPrinterProfiles],
              function(err) {
                if (err) {
                  console.error('Error creating default app settings:', err)
                } else {
                  console.log('Default app settings created')
                }
                resolve()
              }
            )
          }
        )
      } else {
        // Check if app settings exist
        database.get('SELECT id FROM app_settings LIMIT 1', (err, row) => {
          if (err) {
            console.error('Error checking app settings:', err)
            resolve()
            return
          }
          
          if (!row) {
            // Create default app settings with printer profiles
            const defaultPrinterProfiles = JSON.stringify([
              {
                id: "ender3-pro",
                name: "Ender 3 Pro",
                power_draw_watts: 220,
                default_print_speed: 50
              },
              {
                id: "prusa-mk3s",
                name: "Prusa i3 MK3S+",
                power_draw_watts: 120,
                default_print_speed: 60
              }
            ])
            
            database.run(
              'INSERT INTO app_settings (electricity_cost_per_kwh, labor_rate_per_hour, default_marketing_percentage, platform_fee_percentage, misc_buffer_percentage, currency, app_name, footer_text, printer_profiles) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [0.12, 25.0, 10.0, 5.0, 5.0, 'USD', '3DP Commander', 'Powered by 3DP Commander - 3D Printing Business Management', defaultPrinterProfiles],
              function(err) {
                if (err) {
                  console.error('Error creating default app settings:', err)
                } else {
                  console.log('Default app settings created')
                }
                resolve()
              }
            )
          } else {
            resolve()
          }
        })
      }
    })
  })
}

export const closeDatabase = (): void => {
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

// Function to update inventory quantity and check for low stock
export async function updateInventoryQuantity(
  materialId: number, 
  quantityUsed: number, 
  userId: number = 1
): Promise<{ success: boolean; newStatus?: string; wasLowStock?: boolean }> {
  try {
    const database = getDatabase()
    
    // Get current inventory item
    const inventoryItem = await new Promise<any>((resolve, reject) => {
      database.get(
        'SELECT * FROM inventory WHERE id = ?',
        [materialId],
        (err, row) => {
          if (err) {
            reject(err)
          } else {
            resolve(row)
          }
        }
      )
    })

    if (!inventoryItem) {
      return { success: false }
    }

    const currentQuantity = inventoryItem.quantity_available
    const newQuantity = Math.max(0, currentQuantity - quantityUsed)
    const oldStatus = inventoryItem.status
    const newStatus = calculateInventoryStatus(newQuantity, inventoryItem.minimum_threshold)

    // Update inventory quantity and status
    await new Promise<void>((resolve, reject) => {
      database.run(
        'UPDATE inventory SET quantity_available = ?, status = ?, updated_at = datetime("now") WHERE id = ?',
        [newQuantity, newStatus, materialId],
        function(err) {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        }
      )
    })

    // Check if status changed to low or out of stock
    const wasLowStock = (oldStatus === "Normal" && (newStatus === "Low" || newStatus === "Out"))

    return { 
      success: true, 
      newStatus, 
      wasLowStock 
    }
  } catch (error) {
    console.error("Error updating inventory quantity:", error)
    return { success: false }
  }
}

// Function to get finished goods inventory for a product
export async function getFinishedGoodsInventory(productId: number): Promise<number> {
  try {
    const database = getDatabase()
    
    const result = await new Promise<any>((resolve, reject) => {
      database.get(
        'SELECT quantity_available FROM finished_goods_inventory WHERE product_id = ?',
        [productId],
        (err, row) => {
          if (err) {
            reject(err)
          } else {
            resolve(row)
          }
        }
      )
    })

    return result ? result.quantity_available : 0
  } catch (error) {
    console.error("Error getting finished goods inventory:", error)
    return 0
  }
}

// Function to add finished goods to inventory (when production is completed)
export async function addFinishedGoodsToInventory(
  productId: number, 
  quantity: number
): Promise<{ success: boolean; newQuantity?: number }> {
  try {
    const database = getDatabase()
    
    // Check if inventory record exists for this product
    const existingRecord = await new Promise<any>((resolve, reject) => {
      database.get(
        'SELECT * FROM finished_goods_inventory WHERE product_id = ?',
        [productId],
        (err, row) => {
          if (err) {
            reject(err)
          } else {
            resolve(row)
          }
        }
      )
    })

    if (existingRecord) {
      // Update existing record
      const newQuantity = existingRecord.quantity_available + quantity
      await new Promise<void>((resolve, reject) => {
        database.run(
          'UPDATE finished_goods_inventory SET quantity_available = ?, updated_at = datetime("now") WHERE product_id = ?',
          [newQuantity, productId],
          function(err) {
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          }
        )
      })
      
      return { success: true, newQuantity }
    } else {
      // Create new record
      await new Promise<void>((resolve, reject) => {
        database.run(
          'INSERT INTO finished_goods_inventory (product_id, quantity_available, created_at, updated_at) VALUES (?, ?, datetime("now"), datetime("now"))',
          [productId, quantity],
          function(err) {
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          }
        )
      })
      
      return { success: true, newQuantity: quantity }
    }
  } catch (error) {
    console.error("Error adding finished goods to inventory:", error)
    return { success: false }
  }
}

// Function to reserve finished goods for an order
export async function reserveFinishedGoods(
  productId: number, 
  quantity: number
): Promise<{ success: boolean; availableQuantity?: number }> {
  try {
    const database = getDatabase()
    
    // Get current inventory
    const inventoryRecord = await new Promise<any>((resolve, reject) => {
      database.get(
        'SELECT quantity_available, reserved_quantity FROM finished_goods_inventory WHERE product_id = ?',
        [productId],
        (err, row) => {
          if (err) {
            reject(err)
          } else {
            resolve(row)
          }
        }
      )
    })

    if (!inventoryRecord) {
      return { success: false, availableQuantity: 0 }
    }

    const availableQuantity = inventoryRecord.quantity_available - inventoryRecord.reserved_quantity
    
    if (availableQuantity < quantity) {
      return { success: false, availableQuantity }
    }

    // Reserve the quantity
    const newReservedQuantity = inventoryRecord.reserved_quantity + quantity
    await new Promise<void>((resolve, reject) => {
      database.run(
        'UPDATE finished_goods_inventory SET reserved_quantity = ?, updated_at = datetime("now") WHERE product_id = ?',
        [newReservedQuantity, productId],
        function(err) {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        }
      )
    })
    
    return { success: true, availableQuantity }
  } catch (error) {
    console.error("Error reserving finished goods:", error)
    return { success: false }
  }
}

// Function to deduct finished goods from inventory (when order is confirmed)
export async function deductFinishedGoodsFromInventory(
  productId: number, 
  quantity: number
): Promise<{ success: boolean; newQuantity?: number }> {
  try {
    const database = getDatabase()
    
    // Get current inventory
    const inventoryRecord = await new Promise<any>((resolve, reject) => {
      database.get(
        'SELECT quantity_available, reserved_quantity FROM finished_goods_inventory WHERE product_id = ?',
        [productId],
        (err, row) => {
          if (err) {
            reject(err)
          } else {
            resolve(row)
          }
        }
      )
    })

    if (!inventoryRecord) {
      return { success: false }
    }

    const newQuantity = Math.max(0, inventoryRecord.quantity_available - quantity)
    const newReservedQuantity = Math.max(0, inventoryRecord.reserved_quantity - quantity)
    
    await new Promise<void>((resolve, reject) => {
      database.run(
        'UPDATE finished_goods_inventory SET quantity_available = ?, reserved_quantity = ?, updated_at = datetime("now") WHERE product_id = ?',
        [newQuantity, newReservedQuantity, productId],
        function(err) {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        }
      )
    })
    
    return { success: true, newQuantity }
  } catch (error) {
    console.error("Error deducting finished goods from inventory:", error)
    return { success: false }
  }
}

// Database Types
export interface Product {
  id: number
  product_name: string
  sku: string
  category: string
  required_materials: string[] | string
  print_time: number
  weight: number
  printer_type: string
  image_url?: string | null
  description?: string | null
  created_at: string
  updated_at: string
}

export interface InventoryItem {
  id: number
  material_name: string
  material_type: string
  color: string
  price_per_kg: number
  quantity_available: number
  supplier: string
  minimum_threshold: number
  status: "Normal" | "Low" | "Out"
  notes?: string | null
  created_at: string
  updated_at: string
}

// Function to calculate inventory status based on quantity and threshold
export function calculateInventoryStatus(quantity: number, threshold: number): "Normal" | "Low" | "Out" {
  if (quantity <= 0) return "Out"
  if (quantity <= threshold) return "Low"
  return "Normal"
}

// Function to check printer maintenance status
export function checkPrinterMaintenance(lastMaintenanceDate: string, hoursPrinted: number): {
  needsMaintenance: boolean
  isOverdue: boolean
  daysSinceMaintenance: number
  recommendedMaintenanceHours: number
} {
  const today = new Date()
  const lastMaintenance = new Date(lastMaintenanceDate)
  const daysSinceMaintenance = Math.floor((today.getTime() - lastMaintenance.getTime()) / (1000 * 60 * 60 * 24))
  
  // Recommended maintenance every 30 days or 500 hours
  const recommendedMaintenanceDays = 30
  const recommendedMaintenanceHours = 500
  
  // Check if maintenance is needed based on time OR hours since last maintenance
  // For hours, we need to track hours since last maintenance, not total hours
  const needsMaintenance = daysSinceMaintenance >= recommendedMaintenanceDays || hoursPrinted >= recommendedMaintenanceHours
  const isOverdue = daysSinceMaintenance >= (recommendedMaintenanceDays * 1.5) || hoursPrinted >= (recommendedMaintenanceHours * 1.2)
  
  return {
    needsMaintenance,
    isOverdue,
    daysSinceMaintenance,
    recommendedMaintenanceHours
  }
}

export interface Printer {
  id: number
  printer_name: string
  model: string
  status: "Idle" | "Printing" | "Maintenance" | "Offline"
  power_consumption: number
  hours_printed: number
  last_maintenance_date: string
  job_queue: number
  location?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface Order {
  id: number
  order_id: string
  customer_name: string
  customer_email?: string | null
  customer_phone?: string | null
  source: string
  ordered_products: string
  total_quantity: number
  total_amount: number
  status: "New" | "In Progress" | "Shipped" | "Delivered" | "Cancelled"
  tracking_number?: string | null
  shipping_address?: string | null
  notes?: string | null
  order_date: string
  shipped_date?: string | null
  delivered_date?: string | null
  created_at: string
  updated_at: string
}

export interface Expense {
  id: number
  expense_type: string
  amount: number
  date: string
  description: string
  vendor?: string | null
  receipt_url?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface PrintJob {
  id: number
  product_id: number
  printer_id: number
  quantity: number
  estimated_print_time: number
  status: "Pending" | "Printing" | "Completed" | "Failed" | "Cancelled"
  started_at?: string | null
  completed_at?: string | null
  created_at: string
  updated_at: string
}

export interface User {
  id: number
  email: string
  full_name: string
  role: string
  department: string
  phone?: string
  bio?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  created_at: string
  updated_at: string
  is_active?: boolean
}

export interface PrinterProfile {
  id: string
  name: string
  power_draw_watts: number
  default_print_speed: number
}

export interface Component {
  id: number
  component_name: string
  description?: string | null
  part_number?: string | null
  category: string
  cost: number
  supplier?: string | null
  minimum_stock_level: number
  serial_number_tracking: boolean
  created_at: string
  updated_at: string
}

export interface AppSettings {
  id?: number
  electricity_cost_per_kwh: number
  labor_rate_per_hour: number
  default_marketing_percentage: number
  platform_fee_percentage: number
  misc_buffer_percentage: number
  currency: string
  app_name: string
  app_logo_url?: string | null
  footer_text?: string | null
  printer_profiles?: PrinterProfile[]
  created_at?: string
  updated_at?: string
} 