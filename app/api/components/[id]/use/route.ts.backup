import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/local-db"
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

    const db = getDatabase()
    
    // Get current component stock
    const component = await new Promise<any>((resolve, reject) => {
      db.get(`
        SELECT 
          c.*,
          COALESCE(ci.current_stock, 0) as current_stock,
          COALESCE(ci.reserved_stock, 0) as reserved_stock
        FROM components c
        LEFT JOIN component_inventory ci ON c.id = ci.component_id
        WHERE c.id = ?
      `, [params.id], (err, row) => {
        if (err) {
          reject(err)
        } else {
          resolve(row)
        }
      })
    })

    if (!component) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 })
    }

    const availableStock = component.current_stock - component.reserved_stock
    if (availableStock < quantity) {
      return NextResponse.json({ 
        error: `Insufficient stock. Available: ${availableStock}, Requested: ${quantity}` 
      }, { status: 400 })
    }

    // Update component inventory
    const newCurrentStock = component.current_stock - quantity
    await new Promise<void>((resolve, reject) => {
      db.run(`
        UPDATE component_inventory 
        SET current_stock = ?, updated_at = datetime('now')
        WHERE component_id = ?
      `, [newCurrentStock, params.id], (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })

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