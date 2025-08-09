import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { verifyToken } from "@/lib/auth"
import { createPrinterNotification } from "@/lib/notifications"

// Helper function to check printer maintenance status
function checkPrinterMaintenance(lastMaintenanceDate: string, hoursPrinted: number): {
  needsMaintenance: boolean
  isOverdue: boolean
  daysSinceMaintenance: number
  recommendedMaintenanceHours: number
} {
  const today = new Date()
  const lastMaintenance = new Date(lastMaintenanceDate)
  const daysSinceMaintenance = Math.floor((today.getTime() - lastMaintenance.getTime()) / (1000 * 60 * 60 * 24))
  
  // Recommended maintenance every 30 days or 500 hours
  const recommendedMaintenanceDays = 30
  const recommendedMaintenanceHours = 500
  
  // Check if maintenance is needed based on time OR hours since last maintenance
  const needsMaintenance = daysSinceMaintenance >= recommendedMaintenanceDays || hoursPrinted >= recommendedMaintenanceHours
  const isOverdue = daysSinceMaintenance >= (recommendedMaintenanceDays * 1.5) || hoursPrinted >= (recommendedMaintenanceHours * 1.2)
  
  return {
    needsMaintenance,
    isOverdue,
    daysSinceMaintenance,
    recommendedMaintenanceHours
  }
}

export async function GET(request: NextRequest) {
  try {
    // Query printers from Supabase
    const { data: printers, error } = await supabaseAdmin
      .from('printers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

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

    // Check maintenance status for new printer
    const maintenanceStatus = checkPrinterMaintenance(
      last_maintenance_date || new Date().toISOString().split('T')[0], 
      hours_printed || 0
    )

    // Insert printer into Supabase
    const { data: printer, error } = await supabaseAdmin
      .from('printers')
      .insert({
        printer_name,
        model,
        status: status || 'Idle',
        power_consumption: power_consumption || 0,
        hours_printed: hours_printed || 0,
        last_maintenance_date: last_maintenance_date || new Date().toISOString().split('T')[0],
        job_queue: job_queue || 0,
        location: location || null,
        notes: notes || null
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

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