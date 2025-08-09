import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { verifyToken } from "@/lib/auth"
import { createPrinterNotification } from "@/lib/notifications"

// Helper function to check printer maintenance status
function checkPrinterMaintenance(lastMaintenanceDate: string, hoursPrinted: number) {
  const today = new Date()
  const lastMaintenance = new Date(lastMaintenanceDate)
  const daysSinceMaintenance = Math.floor((today.getTime() - lastMaintenance.getTime()) / (1000 * 60 * 60 * 24))
  
  // Maintenance is due every 30 days or every 1000 hours
  const maintenanceDueDays = 30
  const maintenanceDueHours = 1000
  
  const needsMaintenance = daysSinceMaintenance >= maintenanceDueDays || hoursPrinted >= maintenanceDueHours
  const isOverdue = daysSinceMaintenance >= maintenanceDueDays * 1.5 || hoursPrinted >= maintenanceDueHours * 1.2
  
  return {
    needsMaintenance,
    isOverdue,
    daysSinceMaintenance
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

    // Get all printers from Supabase
    const { data: printers, error } = await supabaseAdmin
      .from('printers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    const notifications = []
    const userId = parseInt(decoded.userId) || 1

    // Check each printer for maintenance needs
    for (const printer of printers || []) {
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