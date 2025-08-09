import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/local-db"
import { verifyToken } from "@/lib/auth"

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
    const { tables } = body // Array of table names to export

    if (!tables || !Array.isArray(tables)) {
      return NextResponse.json({ error: "Tables array is required" }, { status: 400 })
    }

    const database = getDatabase()
    const exportData: Record<string, any[]> = {}

    // Export each requested table
    for (const tableName of tables) {
      const data = await new Promise<any[]>((resolve, reject) => {
        database.all(`SELECT * FROM ${tableName}`, (err, rows) => {
          if (err) {
            reject(err)
          } else {
            resolve(rows || [])
          }
        })
      })
      exportData[tableName] = data
    }

    // Generate CSV content for each table
    const csvData: Record<string, string> = {}
    
    for (const [tableName, data] of Object.entries(exportData)) {
      if (data.length === 0) {
        csvData[tableName] = ""
        continue
      }

      const headers = Object.keys(data[0])
      const csvRows = [
        headers.join(','), // Header row
        ...data.map(row => 
          headers.map(header => {
            const value = row[header]
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          }).join(',')
        )
      ]
      
      csvData[tableName] = csvRows.join('\n')
    }

    return NextResponse.json({
      success: true,
      data: csvData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("Export API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 