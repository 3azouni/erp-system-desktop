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

    // Verify token and get user data
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
    
    const user = await new Promise<any>((resolve, reject) => {
      database.get(
        'SELECT * FROM users WHERE id = ?',
        [decoded.userId || 1],
        (err, row) => {
          if (err) {
            reject(err)
          } else {
            resolve(row)
          }
        }
      )
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Profile API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const body = await request.json()

    // Verify token and get user data
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
    
    // Update user profile in database
    await new Promise<void>((resolve, reject) => {
      database.run(
        `UPDATE users SET 
         full_name = ?, phone = ?, bio = ?, address = ?, 
         city = ?, state = ?, zip = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [
          body.full_name || "",
          body.phone || "",
          body.bio || "",
          body.address || "",
          body.city || "",
          body.state || "",
          body.zip || "",
          decoded.userId || 1
        ],
        function(err) {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        }
      )
    })

    // Get updated user data
    const user = await new Promise<any>((resolve, reject) => {
      database.get(
        'SELECT * FROM users WHERE id = ?',
        [decoded.userId || 1],
        (err, row) => {
          if (err) {
            reject(err)
          } else {
            resolve(row)
          }
        }
      )
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Profile update API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
