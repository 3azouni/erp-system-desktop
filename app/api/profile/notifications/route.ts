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
    
    // Get or create notification preferences
    let notifications = await new Promise<any>((resolve, reject) => {
      database.get(
        'SELECT * FROM user_notification_preferences WHERE user_id = ?',
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

    if (!notifications) {
      // Create default notification preferences
      await new Promise<void>((resolve, reject) => {
        database.run(
          `INSERT INTO user_notification_preferences 
           (user_id, email_notifications, push_notifications, sms_notifications, marketing_emails, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [decoded.userId || 1, 1, 1, 0, 0],
          function(err) {
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          }
        )
      })

      // Get the created notification preferences
      notifications = await new Promise<any>((resolve, reject) => {
        database.get(
          'SELECT * FROM user_notification_preferences WHERE user_id = ?',
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
    }

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("Notifications API error:", error)
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
    
    // Update notification preferences
    await new Promise<void>((resolve, reject) => {
      database.run(
        `INSERT OR REPLACE INTO user_notification_preferences 
         (user_id, email_notifications, push_notifications, sms_notifications, marketing_emails, updated_at) 
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [
          decoded.userId || 1,
          body.email_notifications ? 1 : 0,
          body.push_notifications ? 1 : 0,
          body.sms_notifications ? 1 : 0,
          body.marketing_emails ? 1 : 0
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

    // Get updated notification preferences
    const notifications = await new Promise<any>((resolve, reject) => {
      database.get(
        'SELECT * FROM user_notification_preferences WHERE user_id = ?',
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

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("Notifications update API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
