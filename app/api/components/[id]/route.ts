import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/local-db"
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

    const db = getDatabase()
    
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

    return NextResponse.json({ component })
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

    const db = getDatabase()
    
    await new Promise<void>((resolve, reject) => {
      db.run(`
        UPDATE components SET
          component_name = ?,
          description = ?,
          part_number = ?,
          category = ?,
          cost = ?,
          supplier = ?,
          minimum_stock_level = ?,
          serial_number_tracking = ?,
          updated_at = ?
        WHERE id = ?
      `, [
        component_name,
        description || null,
        part_number || null,
        category,
        cost,
        supplier || null,
        minimum_stock_level || 0,
        serial_number_tracking ? 1 : 0,
        new Date().toISOString(),
        params.id
      ], (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })

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

    const db = getDatabase()
    
    // Get component name before deletion for notification
    const component = await new Promise<any>((resolve, reject) => {
      db.get("SELECT component_name FROM components WHERE id = ?", [params.id], (err, row) => {
        if (err) {
          reject(err)
        } else {
          resolve(row)
        }
      })
    })
    
    // Delete component inventory first
    await new Promise<void>((resolve, reject) => {
      db.run("DELETE FROM component_inventory WHERE component_id = ?", [params.id], (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })

    // Delete component
    await new Promise<void>((resolve, reject) => {
      db.run("DELETE FROM components WHERE id = ?", [params.id], (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })

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