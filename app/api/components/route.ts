import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { verifyToken } from "@/lib/auth"
import { createComponentNotification } from "@/lib/notifications"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Query components with inventory from Supabase
    const { data: components, error } = await supabaseAdmin
      .from('components')
      .select(`
        *,
        component_inventory!left(
          current_stock,
          reserved_stock
        )
      `)
      .order('component_name')

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Transform data to match expected format
    const transformedComponents = components?.map(component => ({
      ...component,
      current_stock: component.component_inventory?.current_stock || 0,
      reserved_stock: component.component_inventory?.reserved_stock || 0
    })) || []

    return NextResponse.json({ components: transformedComponents })
  } catch (error) {
    console.error("Error fetching components:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
      initial_stock,
      serial_number_tracking
    } = body

    if (!component_name || !category || cost === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Insert component into Supabase
    const { data: component, error: componentError } = await supabaseAdmin
      .from('components')
      .insert({
        component_name,
        description: description || null,
        part_number: part_number || null,
        category,
        cost,
        supplier: supplier || null,
        minimum_stock_level: minimum_stock_level || 0,
        serial_number_tracking: serial_number_tracking || false
      })
      .select()
      .single()

    if (componentError) {
      console.error("Supabase error:", componentError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Initialize inventory record with initial stock
    const { error: inventoryError } = await supabaseAdmin
      .from('component_inventory')
      .insert({
        component_id: component.id,
        current_stock: initial_stock || 0,
        reserved_stock: 0
      })

    if (inventoryError) {
      console.error("Supabase inventory error:", inventoryError)
      // Continue anyway as the component was created
    }

    // Create notification for new component
    try {
      await createComponentNotification(1, component_name, 'created')
    } catch (error) {
      console.error("Error creating component notification:", error)
    }

    return NextResponse.json({ 
      message: "Component created successfully",
      component_id: component.id 
    })
  } catch (error) {
    console.error("Error creating component:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 