import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { getDatabase, initializeDatabase } from "@/lib/local-db"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const notificationId = params.id

    // Initialize database if needed
    try {
      await initializeDatabase()
    } catch (error) {
      console.error("Database initialization error:", error)
    }

    const database = getDatabase()
    
    // Update the notification to mark as read
    await new Promise<void>((resolve, reject) => {
      database.run(
        `UPDATE notifications SET read = 1, updated_at = datetime('now') 
         WHERE id = ? AND user_id = ?`,
        [notificationId, decoded.userId || 1],
        function(err) {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        }
      )
    })

    // Get the updated notification
    const notification = await new Promise<any>((resolve, reject) => {
      database.get(
        'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
        [notificationId, decoded.userId || 1],
        (err, row) => {
          if (err) {
            reject(err)
          } else {
            resolve(row)
          }
        }
      )
    })

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    return NextResponse.json({ notification })
  } catch (error) {
    console.error("Mark notification as read API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
