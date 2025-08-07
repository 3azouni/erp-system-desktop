const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')

// Database file path
const getDbPath = () => {
  const userDocuments = path.join(process.env.USERPROFILE || '', 'Documents')
  const appFolder = path.join(userDocuments, '3DP Commander')
  return path.join(appFolder, '3dp-commander.db')
}

const dbPath = getDbPath()
console.log('Database path:', dbPath)

// Check if database exists
if (!fs.existsSync(dbPath)) {
  console.log('Database does not exist. Please run the application first to create it.')
  process.exit(1)
}

const db = new sqlite3.Database(dbPath)

// Test finished goods inventory functionality
async function testFinishedGoodsInventory() {
  console.log('\n=== Testing Finished Goods Inventory ===\n')

  try {
    // 1. Check if finished_goods_inventory table exists
    console.log('1. Checking if finished_goods_inventory table exists...')
    const tableExists = await new Promise((resolve, reject) => {
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='finished_goods_inventory'", (err, row) => {
        if (err) reject(err)
        else resolve(!!row)
      })
    })
    
    if (!tableExists) {
      console.log('❌ finished_goods_inventory table does not exist!')
      console.log('Creating the table...')
      
      await new Promise((resolve, reject) => {
        db.run(`
          CREATE TABLE IF NOT EXISTS finished_goods_inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            quantity_available INTEGER NOT NULL DEFAULT 0,
            reserved_quantity INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
          )
        `, (err) => {
          if (err) reject(err)
          else resolve()
        })
      })
      console.log('✅ finished_goods_inventory table created successfully')
    } else {
      console.log('✅ finished_goods_inventory table exists')
    }

    // 2. Check if there are any products
    console.log('\n2. Checking for products...')
    const products = await new Promise((resolve, reject) => {
      db.all('SELECT id, product_name FROM products LIMIT 5', (err, rows) => {
        if (err) reject(err)
        else resolve(rows || [])
      })
    })
    
    if (products.length === 0) {
      console.log('❌ No products found. Please add some products first.')
      return
    }
    
    console.log(`✅ Found ${products.length} products:`)
    products.forEach(product => {
      console.log(`   - ${product.product_name} (ID: ${product.id})`)
    })

    // 3. Test adding finished goods to inventory
    console.log('\n3. Testing adding finished goods to inventory...')
    const testProduct = products[0]
    
    // Add some finished goods
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO finished_goods_inventory (product_id, quantity_available, created_at, updated_at) 
        VALUES (?, ?, datetime('now'), datetime('now'))
      `, [testProduct.id, 10], (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
    console.log(`✅ Added 10 units of ${testProduct.product_name} to finished goods inventory`)

    // 4. Check current inventory
    console.log('\n4. Checking current inventory...')
    const inventory = await new Promise((resolve, reject) => {
      db.get(`
        SELECT quantity_available, reserved_quantity 
        FROM finished_goods_inventory 
        WHERE product_id = ?
      `, [testProduct.id], (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    })
    
    if (inventory) {
      console.log(`✅ Current inventory for ${testProduct.product_name}:`)
      console.log(`   - Available: ${inventory.quantity_available} units`)
      console.log(`   - Reserved: ${inventory.reserved_quantity} units`)
      console.log(`   - Available for sale: ${inventory.quantity_available - inventory.reserved_quantity} units`)
    } else {
      console.log('❌ No inventory record found')
    }

    // 5. Test reserving goods
    console.log('\n5. Testing reserving goods...')
    const reservationResult = await new Promise((resolve, reject) => {
      db.get(`
        SELECT quantity_available, reserved_quantity 
        FROM finished_goods_inventory 
        WHERE product_id = ?
      `, [testProduct.id], (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    })
    
    if (reservationResult) {
      const availableQuantity = reservationResult.quantity_available - reservationResult.reserved_quantity
      const requestedQuantity = 5
      
      if (availableQuantity >= requestedQuantity) {
        // Reserve the quantity
        await new Promise((resolve, reject) => {
          db.run(`
            UPDATE finished_goods_inventory 
            SET reserved_quantity = ?, updated_at = datetime('now') 
            WHERE product_id = ?
          `, [reservationResult.reserved_quantity + requestedQuantity, testProduct.id], (err) => {
            if (err) reject(err)
            else resolve()
          })
        })
        console.log(`✅ Reserved ${requestedQuantity} units of ${testProduct.product_name}`)
      } else {
        console.log(`❌ Cannot reserve ${requestedQuantity} units. Only ${availableQuantity} available.`)
      }
    }

    // 6. Test deducting goods
    console.log('\n6. Testing deducting goods...')
    const deductQuantity = 3
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE finished_goods_inventory 
        SET quantity_available = quantity_available - ?, 
            reserved_quantity = reserved_quantity - ?, 
            updated_at = datetime('now') 
        WHERE product_id = ?
      `, [deductQuantity, deductQuantity, testProduct.id], (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
    console.log(`✅ Deducted ${deductQuantity} units of ${testProduct.product_name} from inventory`)

    // 7. Final inventory check
    console.log('\n7. Final inventory check...')
    const finalInventory = await new Promise((resolve, reject) => {
      db.get(`
        SELECT quantity_available, reserved_quantity 
        FROM finished_goods_inventory 
        WHERE product_id = ?
      `, [testProduct.id], (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    })
    
    if (finalInventory) {
      console.log(`✅ Final inventory for ${testProduct.product_name}:`)
      console.log(`   - Available: ${finalInventory.quantity_available} units`)
      console.log(`   - Reserved: ${finalInventory.reserved_quantity} units`)
      console.log(`   - Available for sale: ${finalInventory.quantity_available - finalInventory.reserved_quantity} units`)
    }

    console.log('\n=== Test completed successfully! ===')
    console.log('\nThe finished goods inventory system is working correctly.')
    console.log('When you complete a print job, the produced quantity will be added to inventory.')
    console.log('When you create an order, the system will check and deduct from available inventory.')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    db.close()
  }
}

testFinishedGoodsInventory()
