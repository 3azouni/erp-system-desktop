import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { verifyToken } from "@/lib/auth"
import { createOrderNotification } from "@/lib/notifications"

// Helper function to reserve finished goods in Supabase
async function reserveFinishedGoods(productId: number, quantity: number) {
  try {
    // Get current inventory
    const { data: inventoryRecord, error } = await supabaseAdmin
      .from('finished_goods_inventory')
      .select('quantity_available, reserved_quantity')
      .eq('product_id', productId)
      .single()

    if (error || !inventoryRecord) {
      return { success: false, availableQuantity: 0 }
    }

    const availableQuantity = inventoryRecord.quantity_available - inventoryRecord.reserved_quantity
    
    if (availableQuantity < quantity) {
      return { success: false, availableQuantity }
    }

    // Reserve the quantity
    const newReservedQuantity = inventoryRecord.reserved_quantity + quantity
    const { error: updateError } = await supabaseAdmin
      .from('finished_goods_inventory')
      .update({ reserved_quantity: newReservedQuantity })
      .eq('product_id', productId)
    
    if (updateError) {
      return { success: false }
    }
    
    return { success: true, availableQuantity }
  } catch (error) {
    console.error("Error reserving finished goods:", error)
    return { success: false }
  }
}

// Helper function to deduct finished goods from inventory
async function deductFinishedGoodsFromInventory(productId: number, quantity: number) {
  try {
    // Get current inventory
    const { data: inventoryRecord, error } = await supabaseAdmin
      .from('finished_goods_inventory')
      .select('quantity_available, reserved_quantity')
      .eq('product_id', productId)
      .single()

    if (error || !inventoryRecord) {
      return { success: false }
    }

    const newQuantity = Math.max(0, inventoryRecord.quantity_available - quantity)
    const newReservedQuantity = Math.max(0, inventoryRecord.reserved_quantity - quantity)
    
    const { error: updateError } = await supabaseAdmin
      .from('finished_goods_inventory')
      .update({ 
        quantity_available: newQuantity, 
        reserved_quantity: newReservedQuantity 
      })
      .eq('product_id', productId)
    
    if (updateError) {
      return { success: false }
    }
    
    return { success: true, newQuantity }
  } catch (error) {
    console.error("Error deducting finished goods from inventory:", error)
    return { success: false }
  }
}

export async function GET(request: NextRequest) {
  try {
    // Query orders from Supabase
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Parse ordered_products JSON strings back into arrays
    const parsedOrders = orders?.map(order => {
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
    }) || []

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

    // Insert order into Supabase
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .insert({
        order_id,
        customer_name,
        customer_email: customer_email || null,
        customer_phone: customer_phone || null,
        source,
        ordered_products: JSON.stringify(ordered_products || []),
        total_quantity: total_quantity || 0,
        total_amount: total_amount || 0,
        status: status || 'New',
        tracking_number: tracking_number || null,
        shipping_address: shipping_address || null,
        notes: notes || null,
        order_date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

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