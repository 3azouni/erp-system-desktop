import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase, checkPrinterMaintenance } from "@/lib/local-db"
import { verifyToken } from "@/lib/auth"
import { createPrinterNotification } from "@/lib/notifications"

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
    const { printer_name, model, status, power_consumption, hours_printed, last_maintenance_date, job_queue, location, notes } = body

    if (!printer_name || !model) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
    }

    // Initialize database if needed
    try {
      await initializeDatabase()
    } catch (error) {
      console.error("Database initialization error:", error)
    }

    const database = getDatabase()
    
    // Get current printer to check for status changes
    const currentPrinter = await new Promise<any>((resolve, reject) => {
      database.get(
        'SELECT * FROM printers WHERE id = ?',
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

    if (!currentPrinter) {
      return NextResponse.json({ error: "Printer not found" }, { status: 404 })
    }

    // Check maintenance status
    const maintenanceStatus = checkPrinterMaintenance(
      last_maintenance_date || new Date().toISOString().split('T')[0], 
      hours_printed || 0
    )
    
    const printer = await new Promise<any>((resolve, reject) => {
      database.run(
        `UPDATE printers SET 
         printer_name = ?, model = ?, status = ?, power_consumption = ?, 
         hours_printed = ?, last_maintenance_date = ?, job_queue = ?, 
         location = ?, notes = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [printer_name, model, status || 'Idle', power_consumption || 0, hours_printed || 0, 
         last_maintenance_date || new Date().toISOString().split('T')[0], job_queue || 0, 
         location || null, notes || null, params.id],
        function(err) {
          if (err) {
            reject(err)
          } else {
            // Get the updated printer
            database.get(
              'SELECT * FROM printers WHERE id = ?',
              [params.id],
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

    // Create notifications for maintenance or status changes
    const statusChanged = currentPrinter.status !== (status || 'Idle')
    
    if (maintenanceStatus.needsMaintenance) {
      try {
        await createPrinterNotification(
          1, 
          printer_name, 
          maintenanceStatus.isOverdue ? 'maintenance_overdue' : 'maintenance_due'
        )
      } catch (error) {
        console.error("Error creating printer maintenance notification:", error)
      }
    }
    
    if (statusChanged) {
      try {
        await createPrinterNotification(1, printer_name, 'status_changed')
      } catch (error) {
        console.error("Error creating printer status notification:", error)
      }
    }

    if (!printer) {
      return NextResponse.json({ error: "Printer not found" }, { status: 404 })
    }

    return NextResponse.json({ printer })
  } catch (error) {
    console.error("Update printer API error:", error)
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
        'DELETE FROM printers WHERE id = ?',
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
    console.error("Delete printer API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 