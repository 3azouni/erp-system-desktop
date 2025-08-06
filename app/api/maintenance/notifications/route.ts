import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase, checkPrinterMaintenance } from "@/lib/local-db"
import { verifyToken } from "@/lib/auth"
import { createPrinterNotification } from "@/lib/notifications"

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

    // Initialize database if needed
    try {
      await initializeDatabase()
    } catch (error) {
      console.error("Database initialization error:", error)
    }

    const database = getDatabase()
    
    // Get all printers
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

    const notifications = []
    const userId = parseInt(decoded.userId) || 1

    // Check each printer for maintenance needs
    for (const printer of printers) {
      const maintenanceStatus = checkPrinterMaintenance(
        printer.last_maintenance_date || new Date().toISOString().split('T')[0],
        printer.hours_printed || 0
      )

      if (maintenanceStatus.needsMaintenance) {
        try {
          await createPrinterNotification(
            userId,
            printer.printer_name,
            maintenanceStatus.isOverdue ? 'maintenance_overdue' : 'maintenance_due'
          )
          
          notifications.push({
            printerName: printer.printer_name,
            status: maintenanceStatus.isOverdue ? 'overdue' : 'due',
            daysSinceMaintenance: maintenanceStatus.daysSinceMaintenance,
            hoursPrinted: printer.hours_printed || 0
          })
        } catch (error) {
          console.error(`Error creating notification for printer ${printer.printer_name}:`, error)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      notifications,
      message: `Created ${notifications.length} maintenance notifications`
    })
  } catch (error) {
    console.error("Maintenance notifications API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 