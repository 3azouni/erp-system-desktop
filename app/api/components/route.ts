import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/local-db"
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

    const db = getDatabase()
    
    const components = await new Promise<any[]>((resolve, reject) => {
      db.all(`
        SELECT 
          c.*,
          COALESCE(ci.current_stock, 0) as current_stock,
          COALESCE(ci.reserved_stock, 0) as reserved_stock
        FROM components c
        LEFT JOIN component_inventory ci ON c.id = ci.component_id
        ORDER BY c.component_name
      `, (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows || [])
        }
      })
    })

    return NextResponse.json({ components })
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

    const db = getDatabase()
    
    const result = await new Promise<any>((resolve, reject) => {
      db.run(`
        INSERT INTO components (
          component_name, description, part_number, category, 
          cost, supplier, minimum_stock_level, serial_number_tracking,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        new Date().toISOString()
      ], function(err) {
        if (err) {
          reject(err)
        } else {
          resolve({ id: this.lastID })
        }
      })
    })

    // Initialize inventory record with initial stock
    await new Promise<void>((resolve, reject) => {
      db.run(`
        INSERT INTO component_inventory (
          component_id, current_stock, reserved_stock, created_at, updated_at
        ) VALUES (?, ?, 0, ?, ?)
      `, [
        result.id,
        initial_stock || 0,
        new Date().toISOString(),
        new Date().toISOString()
      ], (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })

    // Create notification for new component
    try {
      await createComponentNotification(1, component_name, 'created')
    } catch (error) {
      console.error("Error creating component notification:", error)
    }

    return NextResponse.json({ 
      message: "Component created successfully",
      component_id: result.id 
    })
  } catch (error) {
    console.error("Error creating component:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 