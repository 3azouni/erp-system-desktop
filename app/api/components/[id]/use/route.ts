import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { verifyToken } from "@/lib/auth"
import { createComponentNotification } from "@/lib/notifications"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { quantity } = body

    if (!quantity || quantity <= 0) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 })
    }

    // Get current component stock from Supabase
    const { data: component, error: fetchError } = await supabaseAdmin
      .from('components')
      .select(`
        *,
        component_inventory!inner(
          current_stock,
          reserved_stock
        )
      `)
      .eq('id', params.id)
      .single()

    if (fetchError) {
      console.error("Supabase error:", fetchError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!component) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 })
    }

    const currentStock = component.component_inventory?.[0]?.current_stock || 0
    const reservedStock = component.component_inventory?.[0]?.reserved_stock || 0
    const availableStock = currentStock - reservedStock

    if (availableStock < quantity) {
      return NextResponse.json({ 
        error: `Insufficient stock. Available: ${availableStock}, Requested: ${quantity}` 
      }, { status: 400 })
    }

    // Update component inventory
    const newCurrentStock = currentStock - quantity
    const { error: updateError } = await supabaseAdmin
      .from('component_inventory')
      .update({ 
        current_stock: newCurrentStock,
        updated_at: new Date().toISOString()
      })
      .eq('component_id', params.id)

    if (updateError) {
      console.error("Supabase error:", updateError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Create notification for component usage
    try {
      await createComponentNotification(1, component.component_name, 'updated')
    } catch (error) {
      console.error("Error creating component notification:", error)
    }

    return NextResponse.json({ 
      message: `Used ${quantity} of ${component.component_name}`,
      newStock: newCurrentStock
    })
  } catch (error) {
    console.error("Error using component:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 