import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { verifyToken } from "@/lib/auth"
import { createInventoryNotification } from "@/lib/notifications"

// Helper function to calculate inventory status
function calculateInventoryStatus(quantity: number, threshold: number): "Normal" | "Low" | "Out" {
  if (quantity <= 0) return "Out"
  if (quantity <= threshold) return "Low"
  return "Normal"
}

export async function GET(request: NextRequest) {
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

    // Query inventory from Supabase
    const { data: inventory, error } = await supabaseAdmin
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({ inventory })
  } catch (error) {
    console.error("Get inventory API error:", error)
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
    const { material_name, material_type, color, price_per_kg, quantity_available, supplier, minimum_threshold, status, notes } = body

    if (!material_name || !material_type || !color || !supplier) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
    }

    // Calculate status based on quantity and threshold
    const calculatedStatus = calculateInventoryStatus(quantity_available || 0, minimum_threshold || 0)
    
    // Insert new inventory item into Supabase
    const { data: item, error } = await supabaseAdmin
      .from('inventory')
      .insert({
        material_name,
        material_type,
        color,
        price_per_kg: price_per_kg || 0,
        quantity_available: quantity_available || 0,
        supplier,
        minimum_threshold: minimum_threshold || 0,
        status: calculatedStatus,
        notes: notes || null
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Create notification if status is low or out
    if (calculatedStatus === "Low" || calculatedStatus === "Out") {
      try {
        await createInventoryNotification(1, material_name, calculatedStatus === "Out" ? "out" : "low")
      } catch (error) {
        console.error("Error creating inventory notification:", error)
      }
    }

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error("Create inventory API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 