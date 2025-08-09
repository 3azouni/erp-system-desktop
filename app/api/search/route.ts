import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.length < 2) {
      return NextResponse.json([])
    }

    const searchTerm = query.toLowerCase()
    const results: any[] = []

    // Search products
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, product_name, sku, category')
      .or(`product_name.ilike.%${query}%,sku.ilike.%${query}%,category.ilike.%${query}%`)
      .limit(5)

    if (productsError) {
      console.error("Products search error:", productsError)
    }

    if (products) {
      products.forEach(product => {
        results.push({
          id: product.id,
          title: product.product_name,
          description: `${product.sku} • ${product.category}`,
          type: 'Product',
          url: `/products`
        })
      })
    }

    // Search orders
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, order_id, customer_name, source')
      .or(`order_id.ilike.%${query}%,customer_name.ilike.%${query}%,source.ilike.%${query}%`)
      .limit(5)

    if (ordersError) {
      console.error("Orders search error:", ordersError)
    }

    if (orders) {
      orders.forEach(order => {
        results.push({
          id: order.id,
          title: order.order_id,
          description: `${order.customer_name} • ${order.source}`,
          type: 'Order',
          url: `/orders`
        })
      })
    }

    // Search inventory
    const { data: inventory, error: inventoryError } = await supabaseAdmin
      .from('inventory')
      .select('id, material_name, material_type, supplier')
      .or(`material_name.ilike.%${query}%,material_type.ilike.%${query}%,supplier.ilike.%${query}%`)
      .limit(5)

    if (inventoryError) {
      console.error("Inventory search error:", inventoryError)
    }

    if (inventory) {
      inventory.forEach(item => {
        results.push({
          id: item.id,
          title: item.material_name,
          description: `${item.material_type} • ${item.supplier}`,
          type: 'Inventory',
          url: `/inventory`
        })
      })
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json([])
  }
}
