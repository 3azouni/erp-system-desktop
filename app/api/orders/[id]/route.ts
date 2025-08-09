import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { verifyToken } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get order from Supabase
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

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

    // Update order in Supabase
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .update({
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
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

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

    // Delete order from Supabase
    const { error } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete order API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 