import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase, reserveFinishedGoods, deductFinishedGoodsFromInventory } from "@/lib/local-db"
import { verifyToken } from "@/lib/auth"
import { createOrderNotification } from "@/lib/notifications"

export async function GET(request: NextRequest) {
  try {
    // Initialize database if needed
    try {
      await initializeDatabase()
    } catch (error) {
      console.error("Database initialization error:", error)
    }

    const database = getDatabase()
    
    const orders = await new Promise<any[]>((resolve, reject) => {
      database.all(
        'SELECT * FROM orders ORDER BY created_at DESC',
        (err, rows) => {
          if (err) {
            reject(err)
          } else {
            resolve(rows || [])
          }
        }
      )
    })

    // Parse ordered_products JSON strings back into arrays
    const parsedOrders = orders.map(order => {
      let parsedProducts = []
      if (order.ordered_products) {
        if (typeof order.ordered_products === 'string') {
          try {
            if (order.ordered_products === '[]' || order.ordered_products === '') {
              parsedProducts = []
            } else {
              parsedProducts = JSON.parse(order.ordered_products)
            }
          } catch (error) {
            console.error('Error parsing ordered_products:', error, 'Raw value:', order.ordered_products)
            parsedProducts = []
          }
        } else if (Array.isArray(order.ordered_products)) {
          parsedProducts = order.ordered_products
        } else {
          parsedProducts = []
        }
      }
      
      return {
        ...order,
        ordered_products: parsedProducts
      }
    })

    return NextResponse.json({ orders: parsedOrders })
  } catch (error) {
    console.error("Get orders API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { order_id, customer_name, customer_email, customer_phone, source, ordered_products, total_quantity, total_amount, status, tracking_number, shipping_address, notes } = body

    if (!order_id || !customer_name || !source) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
    }

    // Check inventory availability for all products in the order
    if (ordered_products && Array.isArray(ordered_products)) {
      for (const product of ordered_products) {
        if (product.product_id && product.quantity) {
          const reservationResult = await reserveFinishedGoods(product.product_id, product.quantity)
          if (!reservationResult.success) {
            return NextResponse.json({ 
              error: `Insufficient stock for product ${product.product_name}. Available: ${reservationResult.availableQuantity || 0}, Requested: ${product.quantity}` 
            }, { status: 400 })
          }
        }
      }
    }
    const database = getDatabase()
    
    const order = await new Promise<any>((resolve, reject) => {
      database.run(
        `INSERT INTO orders (order_id, customer_name, customer_email, customer_phone, source, ordered_products, total_quantity, total_amount, status, tracking_number, shipping_address, notes, order_date, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'), datetime('now'), datetime('now'))`,
        [order_id, customer_name, customer_email || null, customer_phone || null, source, JSON.stringify(ordered_products || []), total_quantity || 0, total_amount || 0, status || 'New', tracking_number || null, shipping_address || null, notes || null],
        function(err) {
          if (err) {
            reject(err)
          } else {
            // Get the created order
            database.get(
              'SELECT * FROM orders WHERE id = ?',
              [this.lastID],
              (err, order) => {
                if (err) {
                  reject(err)
                } else {
                  resolve(order)
                }
              }
            )
          }
        }
      )
    })

    // Deduct finished goods from inventory for all products in the order
    if (ordered_products && Array.isArray(ordered_products)) {
      for (const product of ordered_products) {
        if (product.product_id && product.quantity) {
          try {
            await deductFinishedGoodsFromInventory(product.product_id, product.quantity)
          } catch (error) {
            console.error(`Error deducting finished goods for product ${product.product_id}:`, error)
          }
        }
      }
    }
    // Parse ordered_products JSON string back into array
    let parsedProducts = []
    if (order.ordered_products) {
      if (typeof order.ordered_products === 'string') {
        try {
          if (order.ordered_products === '[]' || order.ordered_products === '') {
            parsedProducts = []
          } else {
            parsedProducts = JSON.parse(order.ordered_products)
          }
        } catch (error) {
          console.error('Error parsing ordered_products in POST:', error, 'Raw value:', order.ordered_products)
          parsedProducts = []
        }
      } else if (Array.isArray(order.ordered_products)) {
        parsedProducts = order.ordered_products
      } else {
        parsedProducts = []
      }
    }
    
    const parsedOrder = {
      ...order,
      ordered_products: parsedProducts
    }

    // Create notification for new order
    try {
      await createOrderNotification(1, order.order_id, order.customer_name)
    } catch (error) {
      console.error("Error creating order notification:", error)
    }

    return NextResponse.json({ order: parsedOrder }, { status: 201 })
  } catch (error) {
    console.error("Create order API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 