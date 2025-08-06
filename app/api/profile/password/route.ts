import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/local-db"

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 })
    }

    const db = getDatabase()

    // Get session
    const session = await new Promise<any>((resolve, reject) => {
      db.get("SELECT * FROM user_sessions WHERE token = ? AND expires_at > ?", [token, new Date().toISOString()], (err, row) => {
        if (err) {
          reject(err)
        } else {
          resolve(row)
        }
      })
    })

    if (!session) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get current user
    const user = await new Promise<any>((resolve, reject) => {
      db.get("SELECT password_hash FROM users WHERE id = ?", [session.user_id], (err, row) => {
        if (err) {
          reject(err)
        } else {
          resolve(row)
        }
      })
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify current password (simple verification for demo)
    const isValidPassword =
      currentPassword === user.password_hash ||
      user.password_hash === `${currentPassword}_simple_hash` ||
      (currentPassword === "admin123" && user.password_hash === "admin123_simple_hash")

    if (!isValidPassword) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    // Update password (simple hash for demo)
    const newPasswordHash = `${newPassword}_simple_hash`
    await new Promise<void>((resolve, reject) => {
      db.run("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?", [
        newPasswordHash,
        session.user_id
      ], function(err) {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })

    return NextResponse.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Password update API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
