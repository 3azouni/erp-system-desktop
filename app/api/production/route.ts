import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase, updateInventoryQuantity } from "@/lib/local-db"
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
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { productId, quantity, materialsUsed } = body

    if (!productId || !quantity || !materialsUsed || !Array.isArray(materialsUsed)) {
      return NextResponse.json({ error: "Product ID, quantity, and materials used are required" }, { status: 400 })
    }

    // Initialize database if needed
    try {
      await initializeDatabase()
    } catch (error) {
      console.error("Database initialization error:", error)
    }

    const database = getDatabase()
    const results = []
    const notifications = []
    const userId = parseInt(decoded.userId) || 1

    // Process each material used in production
    for (const material of materialsUsed) {
      const { materialId, quantityUsed } = material
      
      if (!materialId || !quantityUsed) {
        continue
      }

      // Update inventory quantity
      const result = await updateInventoryQuantity(materialId, quantityUsed, userId)
      
      if (result.success) {
        results.push({
          materialId,
          quantityUsed,
          newStatus: result.newStatus,
          wasLowStock: result.wasLowStock
        })

        // Create notification if stock became low
        if (result.wasLowStock) {
          try {
            // Get material name for notification
            const materialInfo = await new Promise<any>((resolve, reject) => {
              database.get(
                'SELECT material_name FROM inventory WHERE id = ?',
                [materialId],
                (err, row) => {
                  if (err) {
                    reject(err)
                  } else {
                    resolve(row)
                  }
                }
              )
            })

            if (materialInfo) {
              await createInventoryNotification(
                userId, 
                materialInfo.material_name, 
                result.newStatus === "Out" ? "out" : "low"
              )
              notifications.push({
                materialName: materialInfo.material_name,
                status: result.newStatus
              })
            }
          } catch (error) {
            console.error("Error creating inventory notification:", error)
          }
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