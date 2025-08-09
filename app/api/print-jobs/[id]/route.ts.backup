import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase, addFinishedGoodsToInventory } from "@/lib/local-db"
import { verifyToken } from "@/lib/auth"
import { availabilityService } from "@/lib/availability-service"
import { createPrintJobNotification } from "@/lib/notifications"

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

    await initializeDatabase()
    const database = getDatabase()
    const body = await request.json()
    const { status, started_at, completed_at } = body

    // Get the current job to find the product_id
    const currentJob = await new Promise<any>((resolve, reject) => {
      database.get(
        'SELECT * FROM print_jobs WHERE id = ?',
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

    if (!currentJob) {
      return NextResponse.json({ error: "Print job not found" }, { status: 404 })
    }

    // Update the print job
    const updateFields: string[] = []
    const updateValues: any[] = []

    if (status !== undefined) {
      updateFields.push('status = ?')
      updateValues.push(status)
    }
    if (started_at !== undefined) {
      updateFields.push('started_at = ?')
      updateValues.push(started_at)
    }
    if (completed_at !== undefined) {
      updateFields.push('completed_at = ?')
      updateValues.push(completed_at)
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    updateValues.push(params.id)
    const updateQuery = `UPDATE print_jobs SET ${updateFields.join(', ')}, updated_at = datetime('now') WHERE id = ?`

    await new Promise<void>((resolve, reject) => {
      database.run(updateQuery, updateValues, function(err) {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })

    // If job is being completed, add finished goods to inventory
    if (status === "Completed" && currentJob.product_id && currentJob.quantity) {
      try {
        const result = await addFinishedGoodsToInventory(currentJob.product_id, currentJob.quantity)
        if (result.success) {
          console.log(`Added ${currentJob.quantity} units of product ${currentJob.product_id} to finished goods inventory`)
        } else {
          console.error("Failed to add finished goods to inventory")
        }
      } catch (error) {
        console.error("Error adding finished goods to inventory:", error)
      }
    }
    // Clear availability cache for the product
    if (currentJob.product_id) {
      availabilityService.clearCacheForProduct(currentJob.product_id.toString())
    }

    // Get the updated job
    const updatedJob = await new Promise<any>((resolve, reject) => {
      database.get(
        'SELECT * FROM print_jobs WHERE id = ?',
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

    return NextResponse.json({ job: updatedJob })
  } catch (error) {
    console.error("Update print job API error:", error)
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

    await initializeDatabase()
    const database = getDatabase()

    // Get the current job to find the product_id before deletion
    const currentJob = await new Promise<any>((resolve, reject) => {
      database.get(
        'SELECT * FROM print_jobs WHERE id = ?',
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

    if (!currentJob) {
      return NextResponse.json({ error: "Print job not found" }, { status: 404 })
    }

    // Delete the print job
    await new Promise<void>((resolve, reject) => {
      database.run(
        'DELETE FROM print_jobs WHERE id = ?',
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

    // Clear availability cache for the product
    if (currentJob.product_id) {
      availabilityService.clearCacheForProduct(currentJob.product_id.toString())
    }

    return NextResponse.json({ message: "Print job deleted successfully" })
  } catch (error) {
    console.error("Delete print job API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 