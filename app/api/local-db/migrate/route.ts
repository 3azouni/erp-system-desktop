import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/local-db"

export async function POST(request: NextRequest) {
  try {
    const database = getDatabase()
    
    // Add profile columns to users table if they don't exist
    const migrations = [
      "ALTER TABLE users ADD COLUMN phone TEXT",
      "ALTER TABLE users ADD COLUMN bio TEXT", 
      "ALTER TABLE users ADD COLUMN address TEXT",
      "ALTER TABLE users ADD COLUMN city TEXT",
      "ALTER TABLE users ADD COLUMN state TEXT",
      "ALTER TABLE users ADD COLUMN zip TEXT"
    ]

    // Create notification preferences table if it doesn't exist
    const tableMigrations = [
      `CREATE TABLE IF NOT EXISTS user_notification_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        email_notifications BOOLEAN DEFAULT 1,
        push_notifications BOOLEAN DEFAULT 1,
        sms_notifications BOOLEAN DEFAULT 0,
        marketing_emails BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`
    ]

    for (const migration of migrations) {
      try {
        await new Promise<void>((resolve, reject) => {
          database.run(migration, (err) => {
            if (err) {
              // Column might already exist, which is fine
              console.log(`Migration ${migration} skipped (column may already exist):`, err.message)
            }
            resolve()
          })
        })
      } catch (error) {
        console.log(`Migration ${migration} failed:`, error)
        // Continue with other migrations
      }
    }

    // Run table migrations
    for (const migration of tableMigrations) {
      try {
        await new Promise<void>((resolve, reject) => {
          database.run(migration, (err) => {
            if (err) {
              console.log(`Table migration ${migration} failed:`, err.message)
            }
            resolve()
          })
        })
      } catch (error) {
        console.log(`Table migration failed:`, error)
        // Continue with other migrations
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Database migration completed" 
    })
  } catch (error) {
    console.error("Database migration error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to run database migration" 
      },
      { status: 500 }
    )
  }
} 