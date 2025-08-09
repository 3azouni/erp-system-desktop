import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { verifyToken } from "@/lib/auth"
import { createComponentNotification } from "@/lib/notifications"

export async function GET(
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

    // Get component with inventory data from Supabase
    const { data: component, error } = await supabaseAdmin
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

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!component) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 })
    }

    // Format the response to match the expected structure
    const formattedComponent = {
      ...component,
      current_stock: component.component_inventory?.[0]?.current_stock || 0,
      reserved_stock: component.component_inventory?.[0]?.reserved_stock || 0
    }

    return NextResponse.json({ component: formattedComponent })
  } catch (error) {
    console.error("Error fetching component:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
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
    const {
      component_name,
      description,
      part_number,
      category,
      cost,
      supplier,
      minimum_stock_level,
      serial_number_tracking
    } = body

    if (!component_name || !category || cost === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Update component in Supabase
    const { error } = await supabaseAdmin
      .from('components')
      .update({
        component_name,
        description: description || null,
        part_number: part_number || null,
        category,
        cost,
        supplier: supplier || null,
        minimum_stock_level: minimum_stock_level || 0,
        serial_number_tracking: serial_number_tracking || false,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Create notification for component update
    try {
      await createComponentNotification(1, component_name, 'updated')
    } catch (error) {
      console.error("Error creating component notification:", error)
    }

    return NextResponse.json({ message: "Component updated successfully" })
  } catch (error) {
    console.error("Error updating component:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
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

    // Get component name before deletion for notification
    const { data: component, error: fetchError } = await supabaseAdmin
      .from('components')
      .select('component_name')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      console.error("Error fetching component:", fetchError)
    }
    
    // Delete component inventory first
    const { error: inventoryError } = await supabaseAdmin
      .from('component_inventory')
      .delete()
      .eq('component_id', params.id)

    if (inventoryError) {
      console.error("Error deleting component inventory:", inventoryError)
    }

    // Delete component
    const { error } = await supabaseAdmin
      .from('components')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Create notification for component deletion
    if (component) {
      try {
        await createComponentNotification(1, component.component_name, 'deleted')
      } catch (error) {
        console.error("Error creating component notification:", error)
      }
    }

    return NextResponse.json({ message: "Component deleted successfully" })
  } catch (error) {
    console.error("Error deleting component:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 