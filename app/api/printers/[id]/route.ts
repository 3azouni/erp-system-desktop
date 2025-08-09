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

    // Get current printer to check for status changes
    const { data: currentPrinter, error: fetchError } = await supabaseAdmin
      .from('printers')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      console.error("Supabase error:", fetchError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!currentPrinter) {
      return NextResponse.json({ error: "Printer not found" }, { status: 404 })
    }

    // Check maintenance status
    const maintenanceStatus = checkPrinterMaintenance(
      last_maintenance_date || new Date().toISOString().split('T')[0], 
      hours_printed || 0
    )
    
    // Update printer in Supabase
    const { data: printer, error: updateError } = await supabaseAdmin
      .from('printers')
      .update({
        printer_name,
        model,
        status: status || 'Idle',
        power_consumption: power_consumption || 0,
        hours_printed: hours_printed || 0,
        last_maintenance_date: last_maintenance_date || new Date().toISOString().split('T')[0],
        job_queue: job_queue || 0,
        location: location || null,
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error("Supabase error:", updateError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

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

    // Delete printer from Supabase
    const { error } = await supabaseAdmin
      .from('printers')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete printer API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 