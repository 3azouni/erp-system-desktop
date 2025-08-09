import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { getDatabase, initializeDatabase } from "@/lib/local-db"

export async function GET(request: NextRequest) {
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
    
    // Get notifications for the current user
    const notifications = database.prepare(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    ).all(decoded.userId || 1)

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("Get notifications API error:", error)
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
    const { title, message, type = 'info', data } = body

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 })
    }

    // Initialize database if needed
    try {
      await initializeDatabase()
    } catch (error) {
      console.error("Database initialization error:", error)
    }

    const database = getDatabase()
    
    // Create new notification
    const stmt = database.prepare(
      `INSERT INTO notifications (user_id, title, message, type, data, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    )
    const result = stmt.run(decoded.userId || 1, title, message, type, data ? JSON.stringify(data) : null)
    
    // Get the created notification
    const notification = database.prepare('SELECT * FROM notifications WHERE id = ?').get(result.lastInsertRowid)

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error) {
    console.error("Create notification API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
