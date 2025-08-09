import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { verifyToken } from "@/lib/auth"
import { availabilityService } from "@/lib/availability-service"
import { createPrintJobNotification } from "@/lib/notifications"

// Helper function to add finished goods to inventory
async function addFinishedGoodsToInventory(productId: number, quantity: number) {
  // Get the product to find its inventory item
  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .select('id, product_name')
    .eq('id', productId)
    .single()

  if (productError || !product) {
    throw new Error('Product not found')
  }

  // Check if inventory item exists for this product
  const { data: inventoryItem, error: inventoryError } = await supabaseAdmin
    .from('inventory')
    .select('id, quantity_available')
    .eq('material_name', product.product_name)
    .single()

  if (inventoryError) {
    // Create new inventory item if it doesn't exist
    const { error: insertError } = await supabaseAdmin
      .from('inventory')
      .insert({
        material_name: product.product_name,
        material_type: 'Finished Goods',
        color: 'N/A',
        price_per_kg: 0,
        quantity_available: quantity,
        supplier: 'Internal Production',
        minimum_threshold: 0,
        status: 'In Stock',
        notes: 'Auto-generated from production',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (insertError) {
      throw new Error('Failed to create inventory item')
    }
  } else {
    // Update existing inventory item
    const newQuantity = (inventoryItem.quantity_available || 0) + quantity
    const { error: updateError } = await supabaseAdmin
      .from('inventory')
      .update({
        quantity_available: newQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', inventoryItem.id)

    if (updateError) {
      throw new Error('Failed to update inventory')
    }
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { status, started_at, completed_at } = body

    // Get the current job to find the product_id
    const { data: currentJob, error: fetchError } = await supabaseAdmin
      .from('print_jobs')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      console.error("Supabase error:", fetchError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!currentJob) {
      return NextResponse.json({ error: "Print job not found" }, { status: 404 })
    }

    // Update the print job
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status !== undefined) {
      updateData.status = status
    }
    if (started_at !== undefined) {
      updateData.started_at = started_at
    }
    if (completed_at !== undefined) {
      updateData.completed_at = completed_at
    }

    const { data: updatedJob, error: updateError } = await supabaseAdmin
      .from('print_jobs')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error("Supabase error:", updateError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // If job is being completed, add finished goods to inventory
    if (status === "Completed" && currentJob.product_id && currentJob.quantity) {
      try {
        await addFinishedGoodsToInventory(currentJob.product_id, currentJob.quantity)
      } catch (error) {
        console.error("Error adding finished goods to inventory:", error)
        // Silently handle inventory update errors
      }
    }

    // Clear availability cache for the product
    if (currentJob.product_id) {
      availabilityService.clearCacheForProduct(currentJob.product_id.toString())
    }

    return NextResponse.json({ job: updatedJob })
  } catch (error) {
    console.error("Update print job API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get the current job to find the product_id before deletion
    const { data: currentJob, error: fetchError } = await supabaseAdmin
      .from('print_jobs')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      console.error("Supabase error:", fetchError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!currentJob) {
      return NextResponse.json({ error: "Print job not found" }, { status: 404 })
    }

    // Delete the print job
    const { error: deleteError } = await supabaseAdmin
      .from('print_jobs')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error("Supabase error:", deleteError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Clear availability cache for the product
    if (currentJob.product_id) {
      availabilityService.clearCacheForProduct(currentJob.product_id.toString())
    }

    return NextResponse.json({ message: "Print job deleted successfully" })
  } catch (error) {
    console.error("Delete print job API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 