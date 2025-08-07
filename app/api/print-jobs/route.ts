import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/local-db"
import { verifyToken } from "@/lib/auth"
import { availabilityService } from "@/lib/availability-service"

export async function GET(request: NextRequest) {
  try {

    // Initialize database if needed
    try {
      await initializeDatabase()
    } catch (error) {
      console.error("Database initialization error:", error)
    }

    const database = getDatabase()

    return new Promise<NextResponse>((resolve, reject) => {
      database.all(
        `SELECT 
          pj.id,
          pj.product_id,
          pj.printer_id,
          pj.quantity,
          pj.estimated_print_time,
          pj.status,
          pj.started_at,
          pj.completed_at,
          pj.created_at,
          pj.updated_at,
          p.product_name,
          p.sku,
          pr.printer_name,
          pr.model
        FROM print_jobs pj
        LEFT JOIN products p ON pj.product_id = p.id
        LEFT JOIN printers pr ON pj.printer_id = pr.id
        ORDER BY pj.created_at DESC`,
        [],
        (err, rows) => {
          if (err) {
            console.error("Database error:", err)
            resolve(NextResponse.json({ error: "Database error" }, { status: 500 }))
            return
          }

          // Transform the data to match the expected format
          const printJobs = rows.map((row: any) => ({
            id: row.id.toString(),
            job_id: `JOB-${row.id.toString().padStart(6, '0')}`,
            product_id: row.product_id.toString(),
            product_name: row.product_name || "Unknown Product",
            quantity: row.quantity,
            assigned_printer_id: row.printer_id.toString(),
            assigned_printer_name: row.printer_name || "Unknown Printer",
            estimated_time_hours: row.estimated_print_time,
            total_estimated_time: row.estimated_print_time * row.quantity,
            status: row.status,
            priority: "Normal", // Default priority
            customer_name: null,
            due_date: null,
            notes: null,
            started_at: row.started_at,
            completed_at: row.completed_at,
            created_at: row.created_at,
            updated_at: row.updated_at,
          }))

          resolve(NextResponse.json({ printJobs }))
        }
      )
    })
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

    // Initialize database if needed
    try {
      await initializeDatabase()
    } catch (error) {
      console.error("Database initialization error:", error)
    }

    const database = getDatabase()

    return new Promise<NextResponse>((resolve, reject) => {
      database.run(
        `INSERT INTO print_jobs (product_id, printer_id, quantity, estimated_print_time, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [product_id, printer_id, quantity, estimated_print_time, status],
        function(err) {
          if (err) {
            console.error("Database error:", err)
            resolve(NextResponse.json({ error: "Database error" }, { status: 500 }))
            return
          }

          // Update printer job queue
          database.run(
            `UPDATE printers SET job_queue = job_queue + 1 WHERE id = ?`,
            [printer_id],
            (updateErr) => {
              if (updateErr) {
                console.error("Printer update error:", updateErr)
              }
              
              // Clear availability cache for the product
              availabilityService.clearCacheForProduct(product_id.toString())
              
              resolve(NextResponse.json({ 
                success: true, 
                message: "Print job created successfully",
                jobId: this.lastID 
              }))
            }
          )
        }
      )
    })
  } catch (error) {
    console.error("Print jobs API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 