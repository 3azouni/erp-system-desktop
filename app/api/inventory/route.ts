import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase, calculateInventoryStatus } from "@/lib/local-db"
import { verifyToken } from "@/lib/auth"
import { createInventoryNotification } from "@/lib/notifications"

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

    // Initialize database if needed
    try {
      await initializeDatabase()
    } catch (error) {
      console.error("Database initialization error:", error)
    }

    const database = getDatabase()
    
    const inventory = await new Promise<any[]>((resolve, reject) => {
      database.all(
        'SELECT * FROM inventory ORDER BY created_at DESC',
        (err, rows) => {
          if (err) {
            reject(err)
          } else {
            resolve(rows || [])
          }
        }
      )
    })

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

    const database = getDatabase()
    
    // Calculate status based on quantity and threshold
    const calculatedStatus = calculateInventoryStatus(quantity_available || 0, minimum_threshold || 0)
    
    const item = await new Promise<any>((resolve, reject) => {
      database.run(
        `INSERT INTO inventory (material_name, material_type, color, price_per_kg, quantity_available, supplier, minimum_threshold, status, notes, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [material_name, material_type, color, price_per_kg || 0, quantity_available || 0, supplier, minimum_threshold || 0, calculatedStatus, notes || null],
        function(err) {
          if (err) {
            reject(err)
          } else {
            // Get the created item
            database.get(
              'SELECT * FROM inventory WHERE id = ?',
              [this.lastID],
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