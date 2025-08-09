import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/local-db"

interface TableRow {
  name: string
}

interface CountRow {
  count: number
}

export async function GET(request: NextRequest) {
  try {
    const database = getDatabase()
    
    // Check if tables exist
    const tables = await new Promise<string[]>((resolve, reject) => {
      database.all(
        "SELECT name FROM sqlite_master WHERE type='table'",
        (err, rows: TableRow[]) => {
          if (err) {
            reject(err)
          } else {
            resolve(rows?.map(row => row.name) || [])
          }
        }
      )
    })

    // Get row counts for each table
    const tableCounts: Record<string, number> = {}
    
    for (const table of tables) {
      const count = await new Promise<number>((resolve, reject) => {
        database.get(
          `SELECT COUNT(*) as count FROM ${table}`,
          (err, row: CountRow) => {
            if (err) {
              reject(err)
            } else {
              resolve(row?.count || 0)
            }
          }
        )
      })
      tableCounts[table] = count
    }

    return NextResponse.json({ 
      success: true,
      tables,
      tableCounts
    })
  } catch (error) {
    console.error("Database status check error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to check database status" 
      },
      { status: 500 }
    )
  }
} 