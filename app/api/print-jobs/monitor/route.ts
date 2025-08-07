import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/local-db"
import { verifyToken } from "@/lib/auth"
import { createPrintJobNotification } from "@/lib/notifications"

export async function POST(request: NextRequest) {
  try {
    console.log("Monitor endpoint called")
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No authorization header")
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      console.log("Invalid token")
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Initialize database if needed
    try {
      await initializeDatabase()
    } catch (error) {
      console.error("Database initialization error:", error)
    }

    const database = getDatabase()
    const userId = parseInt(decoded.userId) || 1
    const notifications = []

    // Get all jobs that are currently printing
    console.log("Fetching printing jobs...")
    const printingJobs = await new Promise<any[]>((resolve, reject) => {
      database.all(
        `SELECT 
          pj.id,
          pj.product_id,
          pj.quantity,
          pj.estimated_print_time,
          pj.started_at,
          pj.status,
          p.product_name
        FROM print_jobs pj
        LEFT JOIN products p ON pj.product_id = p.id
        WHERE pj.status = 'Printing' AND pj.started_at IS NOT NULL`,
        (err, rows) => {
          if (err) {
            console.error("Database error:", err)
            reject(err)
          } else {
            console.log(`Found ${rows?.length || 0} printing jobs`)
            resolve(rows || [])
          }
        }
      )
    })

    // Check each printing job for overdue status
    for (const job of printingJobs) {
      if (!job.started_at || !job.estimated_print_time) {
        continue
      }

      const startTime = new Date(job.started_at)
      const estimatedHours = parseFloat(job.estimated_print_time)
      const estimatedEndTime = new Date(startTime.getTime() + (estimatedHours * 60 * 60 * 1000))
      const currentTime = new Date()
      
      // If job should have finished by now (with 5 minute buffer)
      const bufferTime = 5 * 60 * 1000 // 5 minutes in milliseconds
      if (currentTime.getTime() > (estimatedEndTime.getTime() + bufferTime)) {
        try {
          await createPrintJobNotification(
            userId,
            job.id.toString(),
            job.product_name || "Unknown Product",
            'overdue'
          )
          
          notifications.push({
            jobId: job.id,
            productName: job.product_name,
            estimatedEndTime: estimatedEndTime.toISOString(),
            overdueBy: Math.round((currentTime.getTime() - estimatedEndTime.getTime()) / (1000 * 60)) // minutes
          })
        } catch (error) {
          console.error(`Error creating overdue notification for job ${job.id}:`, error)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      notifications,
      message: `Checked ${printingJobs.length} printing jobs, found ${notifications.length} overdue jobs`
    })
  } catch (error) {
    console.error("Print job monitoring API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 