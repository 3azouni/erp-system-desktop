import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase, checkPrinterMaintenance } from "@/lib/local-db"
import { verifyToken } from "@/lib/auth"
import { createPrinterNotification } from "@/lib/notifications"

export async function GET(request: NextRequest) {
  try {
    // Initialize database if needed
    try {
      await initializeDatabase()
    } catch (error) {
      console.error("Database initialization error:", error)
    }

    const database = getDatabase()
    
    const printers = await new Promise<any[]>((resolve, reject) => {
      database.all(
        'SELECT * FROM printers ORDER BY created_at DESC',
        (err, rows) => {
          if (err) {
            reject(err)
          } else {
            resolve(rows || [])
          }
        }
      )
    })

    return NextResponse.json({ printers })
  } catch (error) {
    console.error("Get printers API error:", error)
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
    const { printer_name, model, status, power_consumption, hours_printed, last_maintenance_date, job_queue, location, notes } = body

    if (!printer_name || !model) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
    }

    const database = getDatabase()
    
    // Check maintenance status for new printer
    const maintenanceStatus = checkPrinterMaintenance(
      last_maintenance_date || new Date().toISOString().split('T')[0], 
      hours_printed || 0
    )
    
    const printer = await new Promise<any>((resolve, reject) => {
      database.run(
        `INSERT INTO printers (printer_name, model, status, power_consumption, hours_printed, last_maintenance_date, job_queue, location, notes, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [printer_name, model, status || 'Idle', power_consumption || 0, hours_printed || 0, last_maintenance_date || new Date().toISOString().split('T')[0], job_queue || 0, location || null, notes || null],
        function(err) {
          if (err) {
            reject(err)
          } else {
            // Get the created printer
            database.get(
              'SELECT * FROM printers WHERE id = ?',
              [this.lastID],
              (err, printer) => {
                if (err) {
                  reject(err)
                } else {
                  resolve(printer)
                }
              }
            )
          }
        }
      )
    })

    // Create notification if maintenance is needed
    if (maintenanceStatus.needsMaintenance) {
      try {
        await createPrinterNotification(
          1, 
          printer_name, 
          maintenanceStatus.isOverdue ? 'maintenance_overdue' : 'maintenance_due'
        )
      } catch (error) {
        console.error("Error creating printer notification:", error)
      }
    }

    return NextResponse.json({ printer }, { status: 201 })
  } catch (error) {
    console.error("Create printer API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 