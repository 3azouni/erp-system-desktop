import { NextRequest, NextResponse } from "next/server"
import { initializeDatabase } from "@/lib/local-db"

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()
    
    return NextResponse.json({ 
      success: true, 
      message: "Database initialized successfully" 
    })
  } catch (error) {
    console.error("Database initialization error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to initialize database" 
      },
      { status: 500 }
    )
  }
} 