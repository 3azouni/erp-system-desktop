import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { getDatabase, initializeDatabase } from "@/lib/local-db"

export async function DELETE(request: NextRequest) {
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

    // Initialize database if needed
    try {
      await initializeDatabase()
    } catch (error) {
      console.error("Database initialization error:", error)
    }

    const database = getDatabase()
    
    // Delete all notifications for the user
    await new Promise<void>((resolve, reject) => {
      database.run(
        `DELETE FROM notifications WHERE user_id = ?`,
        [decoded.userId || 1],
        function(err) {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        }
      )
    })

    return NextResponse.json({ message: "All notifications cleared successfully" })
  } catch (error) {
    console.error("Clear notifications API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 