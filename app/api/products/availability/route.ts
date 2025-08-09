import { type NextRequest, NextResponse } from "next/server"
import { availabilityService } from "@/lib/availability-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { product_id, quantity } = body

    if (!product_id || !quantity) {
      return NextResponse.json({ error: "Product ID and quantity are required" }, { status: 400 })
    }

    const availability = await availabilityService.getProductAvailability(product_id, quantity)
    return NextResponse.json(availability)

  } catch (error) {
    console.error("Product availability check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 