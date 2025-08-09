import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { verifyToken } from "@/lib/auth"
import { availabilityService } from "@/lib/availability-service"

export async function GET(request: NextRequest) {
  try {
    // Get print jobs with product and printer data from Supabase
    const { data: printJobs, error } = await supabaseAdmin
      .from('print_jobs')
      .select(`
        id,
        product_id,
        printer_id,
        quantity,
        estimated_print_time,
        status,
        started_at,
        completed_at,
        created_at,
        updated_at,
        products!inner(
          product_name,
          sku
        ),
        printers!inner(
          printer_name,
          model
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Transform the data to match the expected format
    const transformedPrintJobs = (printJobs || []).map((row: any) => ({
      id: row.id.toString(),
      job_id: `JOB-${row.id.toString().padStart(6, '0')}`,
      product_id: row.product_id.toString(),
      product_name: row.products?.product_name || "Unknown Product",
      quantity: row.quantity,
      printer_id: row.printer_id.toString(),
      printer_name: row.printers?.printer_name || "Unknown Printer",
      assigned_printer_id: row.printer_id.toString(),
      assigned_printer_name: row.printers?.printer_name || "Unknown Printer",
      estimated_time_hours: row.estimated_print_time,
      estimated_duration: row.estimated_print_time,
      total_estimated_time: row.estimated_print_time * row.quantity,
      status: row.status,
      priority: "Normal", // Default priority
      customer_name: null,
      due_date: null,
      notes: null,
      start_time: null,
      end_time: null,
      actual_duration: 0,
      started_at: row.started_at,
      completed_at: row.completed_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }))

    return NextResponse.json({ printJobs: transformedPrintJobs })
  } catch (error) {
    console.error("Print jobs API error:", error)
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
    const { product_id, printer_id, quantity, estimated_print_time, status = "Pending" } = body

    if (!product_id || !printer_id || !quantity || !estimated_print_time) {
      return NextResponse.json({ error: "Product ID, printer ID, quantity, and estimated print time are required" }, { status: 400 })
    }

    // Insert print job into Supabase
    const { data: printJob, error } = await supabaseAdmin
      .from('print_jobs')
      .insert({
        product_id,
        printer_id,
        quantity,
        estimated_print_time,
        status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Get current printer job queue and increment it
    const { data: printer, error: printerFetchError } = await supabaseAdmin
      .from('printers')
      .select('job_queue')
      .eq('id', printer_id)
      .single()

    if (printerFetchError) {
      console.error("Error fetching printer:", printerFetchError)
    } else {
      // Update printer job queue
      const { error: printerUpdateError } = await supabaseAdmin
        .from('printers')
        .update({ job_queue: (printer?.job_queue || 0) + 1 })
        .eq('id', printer_id)

      if (printerUpdateError) {
        console.error("Printer update error:", printerUpdateError)
      }
    }
    
    // Clear availability cache for the product
    availabilityService.clearCacheForProduct(product_id.toString())
    
    return NextResponse.json({ 
      success: true, 
      message: "Print job created successfully",
      jobId: printJob.id 
    })
  } catch (error) {
    console.error("Print jobs API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 