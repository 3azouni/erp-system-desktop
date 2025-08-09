import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase, calculateInventoryStatus } from "@/lib/local-db"
import { verifyToken } from "@/lib/auth"
import { createInventoryNotification } from "@/lib/notifications"

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

    // Initialize database if needed
    try {
      await initializeDatabase()
    } catch (error) {
      console.error("Database initialization error:", error)
    }

    const database = getDatabase()
    
    // Get current item to check status change
    const currentItem = await new Promise<any>((resolve, reject) => {
      database.get(
        'SELECT * FROM inventory WHERE id = ?',
        [params.id],
        (err, row) => {
          if (err) {
            reject(err)
          } else {
            resolve(row)
          }
        }
      )
    })

    if (!currentItem) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 })
    }

    // Calculate new status based on quantity and threshold
    const calculatedStatus = calculateInventoryStatus(quantity_available || 0, minimum_threshold || 0)
    const oldStatus = currentItem.status
    const statusChanged = oldStatus !== calculatedStatus
    
    const item = await new Promise<any>((resolve, reject) => {
      database.run(
        `UPDATE inventory SET 
         material_name = ?, material_type = ?, color = ?, price_per_kg = ?, 
         quantity_available = ?, supplier = ?, minimum_threshold = ?, status = ?, notes = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [material_name, material_type, color, price_per_kg || 0, quantity_available || 0, supplier, minimum_threshold || 0, calculatedStatus, notes || null, params.id],
        function(err) {
          if (err) {
            reject(err)
          } else {
            // Get the updated item
            database.get(
              'SELECT * FROM inventory WHERE id = ?',
              [params.id],
              (err, item) => {
                if (err) {
                  reject(err)
                } else {
                  resolve(item)
                }
              }
            )
          }
        }
      )
    })

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

    const database = getDatabase()
    
    await new Promise<void>((resolve, reject) => {
      database.run(
        'DELETE FROM inventory WHERE id = ?',
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
    console.error("Delete inventory API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 