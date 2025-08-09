import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { verifyToken } from "@/lib/auth"
import { createInventoryNotification } from "@/lib/notifications"

// Helper function to calculate inventory status
function calculateInventoryStatus(quantity: number, minimumThreshold: number): string {
  if (quantity === 0) {
    return "Out"
  } else if (quantity <= minimumThreshold) {
    return "Low"
  } else {
    return "In Stock"
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
    const { material_name, material_type, color, price_per_kg, quantity_available, supplier, minimum_threshold, status, notes } = body

    if (!material_name || !material_type || !color || !supplier) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
    }

    // Get current item to check status change
    const { data: currentItem, error: fetchError } = await supabaseAdmin
      .from('inventory')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      console.error("Supabase error:", fetchError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!currentItem) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 })
    }

    // Calculate new status based on quantity and threshold
    const calculatedStatus = calculateInventoryStatus(quantity_available || 0, minimum_threshold || 0)
    const oldStatus = currentItem.status
    const statusChanged = oldStatus !== calculatedStatus
    
    // Update inventory item in Supabase
    const { data: item, error: updateError } = await supabaseAdmin
      .from('inventory')
      .update({
        material_name,
        material_type,
        color,
        price_per_kg: price_per_kg || 0,
        quantity_available: quantity_available || 0,
        supplier,
        minimum_threshold: minimum_threshold || 0,
        status: calculatedStatus,
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error("Supabase error:", updateError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Create notification if status changed to low or out
    if (statusChanged && (calculatedStatus === "Low" || calculatedStatus === "Out")) {
      try {
        await createInventoryNotification(1, material_name, calculatedStatus === "Out" ? "out" : "low")
      } catch (error) {
        console.error("Error creating inventory notification:", error)
      }
    }

    if (!item) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 })
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error("Update inventory API error:", error)
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

    // Delete inventory item from Supabase
    const { error } = await supabaseAdmin
      .from('inventory')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete inventory API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 