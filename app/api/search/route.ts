import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/local-db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.length < 2) {
      return NextResponse.json([])
    }

    // Initialize database if needed
    try {
      await initializeDatabase()
    } catch (error) {
      console.error("Database initialization error:", error)
    }

    const database = getDatabase()
    const searchTerm = `%${query}%`
    const results: any[] = []

    // Search products
    const products = await new Promise<any[]>((resolve, reject) => {
      database.all(
        'SELECT id, product_name, sku, category FROM products WHERE product_name LIKE ? OR sku LIKE ? OR category LIKE ? LIMIT 5',
        [searchTerm, searchTerm, searchTerm],
        (err, rows) => {
          if (err) {
            reject(err)
          } else {
            resolve(rows || [])
          }
        }
      )
    })

    products.forEach(product => {
      results.push({
        id: product.id,
        title: product.product_name,
        description: `SKU: ${product.sku} • ${product.category}`,
        type: 'Product',
        url: `/products`
      })
    })

    // Search orders
    const orders = await new Promise<any[]>((resolve, reject) => {
      database.all(
        'SELECT id, order_id, customer_name, source FROM orders WHERE order_id LIKE ? OR customer_name LIKE ? OR source LIKE ? LIMIT 5',
        [searchTerm, searchTerm, searchTerm],
        (err, rows) => {
          if (err) {
            reject(err)
          } else {
            resolve(rows || [])
          }
        }
      )
    })

    orders.forEach(order => {
      results.push({
        id: order.id,
        title: order.order_id,
        description: `${order.customer_name} • ${order.source}`,
        type: 'Order',
        url: `/orders`
      })
    })

    // Search inventory
    const inventory = await new Promise<any[]>((resolve, reject) => {
      database.all(
        'SELECT id, material_name, material_type, supplier FROM inventory WHERE material_name LIKE ? OR material_type LIKE ? OR supplier LIKE ? LIMIT 5',
        [searchTerm, searchTerm, searchTerm],
        (err, rows) => {
          if (err) {
            reject(err)
          } else {
            resolve(rows || [])
          }
        }
      )
    })

    inventory.forEach(item => {
      results.push({
        id: item.id,
        title: item.material_name,
        description: `${item.material_type} • ${item.supplier}`,
        type: 'Inventory',
        url: `/inventory`
      })
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json([])
  }
}
