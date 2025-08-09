import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/local-db"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Delete session
    const db = getDatabase()
    await new Promise<void>((resolve, reject) => {
      db.run("DELETE FROM user_sessions WHERE token = ?", [token], function(err) {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })

    return NextResponse.json({ message: "Logged out successfully" })
  } catch (error) {
    console.error("Logout API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
