import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/local-db"
import { verifyToken } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const database = getDatabase()
    
    const order = await new Promise<any>((resolve, reject) => {
      database.get(
        'SELECT * FROM orders WHERE id = ?',
        [params.id],
        (err, order) => {
          if (err) {
            reject(err)
          } else {
            resolve(order)
          }
        }
      )
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
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
          console.error('Error parsing ordered_products:', error, 'Raw value:', order.ordered_products)
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

    return NextResponse.json({ order: parsedOrder })
  } catch (error) {
    console.error("Get order API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const database = getDatabase()
    
    const order = await new Promise<any>((resolve, reject) => {
      database.run(
        `UPDATE orders SET 
         order_id = ?, customer_name = ?, customer_email = ?, customer_phone = ?, 
         source = ?, ordered_products = ?, total_quantity = ?, total_amount = ?, 
         status = ?, tracking_number = ?, shipping_address = ?, notes = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [order_id, customer_name, customer_email || null, customer_phone || null, source, JSON.stringify(ordered_products || []), total_quantity || 0, total_amount || 0, status || 'New', tracking_number || null, shipping_address || null, notes || null, params.id],
        function(err) {
          if (err) {
            reject(err)
          } else {
            // Get the updated order
            database.get(
              'SELECT * FROM orders WHERE id = ?',
              [params.id],
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

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
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
          console.error('Error parsing ordered_products in PUT:', error, 'Raw value:', order.ordered_products)
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

    return NextResponse.json({ order: parsedOrder })
  } catch (error) {
    console.error("Update order API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const database = getDatabase()
    
    await new Promise<void>((resolve, reject) => {
      database.run(
        'DELETE FROM orders WHERE id = ?',
        [params.id],
        function(err) {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        }
      )
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete order API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 