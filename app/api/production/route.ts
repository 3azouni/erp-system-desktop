import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { verifyToken } from "@/lib/auth"
import { createInventoryNotification } from "@/lib/notifications"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 })
    }

    const body = await request.json()
    const { productId, quantity, materialsUsed } = body

    if (!productId || !quantity || !materialsUsed || !Array.isArray(materialsUsed)) {
      return NextResponse.json({ error: "Product ID, quantity, and materials used are required" }, { status: 400 })
    }

    const results = []
    const notifications = []
    const userId = parseInt(decoded.userId) || 1

    // Process each material used in production
    for (const material of materialsUsed) {
      const { materialId, quantityUsed } = material
      
      if (!materialId || !quantityUsed) {
        continue
      }

      // Get current inventory quantity
      const { data: inventoryItem, error: fetchError } = await supabaseAdmin
        .from('inventory')
        .select('quantity, minimum_stock_level, material_name')
        .eq('id', materialId)
        .single()

      if (fetchError) {
        console.error("Error fetching inventory item:", fetchError)
        continue
      }

      if (!inventoryItem) {
        continue
      }

      const currentQuantity = inventoryItem.quantity || 0
      const newQuantity = Math.max(0, currentQuantity - quantityUsed)
      const minimumStock = inventoryItem.minimum_stock_level || 0
      
      // Determine new status
      let newStatus = "In Stock"
      if (newQuantity === 0) {
        newStatus = "Out"
      } else if (newQuantity <= minimumStock) {
        newStatus = "Low"
      }

      // Check if stock was low before update
      const wasLowStock = currentQuantity > minimumStock && newQuantity <= minimumStock

      // Update inventory quantity
      const { error: updateError } = await supabaseAdmin
        .from('inventory')
        .update({ 
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', materialId)

      if (updateError) {
        console.error("Error updating inventory:", updateError)
        continue
      }

      results.push({
        materialId,
        quantityUsed,
        newStatus,
        wasLowStock
      })

      // Create notification if stock became low
      if (wasLowStock) {
        try {
          await createInventoryNotification(
            userId, 
            inventoryItem.material_name, 
            newStatus === "Out" ? "out" : "low"
          )
          notifications.push({
            materialName: inventoryItem.material_name,
            status: newStatus
          })
        } catch (error) {
          console.error("Error creating inventory notification:", error)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      results, 
      notifications,
      message: `Production completed. ${results.length} materials updated.`
    })
  } catch (error) {
    console.error("Production API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 