import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/local-db"

export async function POST(request: NextRequest) {
  try {
    const database = getDatabase()
    
    // Add sample printers
    const samplePrinters = [
      {
        printer_name: "Printer Alpha",
        model: "Ender 3 Pro",
        status: "Printing",
        power_consumption: 250,
        hours_printed: 120,
        location: "Workshop A"
      },
      {
        printer_name: "Printer Beta",
        model: "Prusa i3 MK3S",
        status: "Idle",
        power_consumption: 200,
        hours_printed: 85,
        location: "Workshop B"
      },
      {
        printer_name: "Printer Gamma",
        model: "Ultimaker S5",
        status: "Maintenance",
        power_consumption: 300,
        hours_printed: 200,
        location: "Workshop C"
      }
    ]

    for (const printer of samplePrinters) {
      await new Promise<void>((resolve, reject) => {
        database.run(
          `INSERT INTO printers (printer_name, model, status, power_consumption, hours_printed, location, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [printer.printer_name, printer.model, printer.status, printer.power_consumption, printer.hours_printed, printer.location],
          function(err) {
            if (err) {
              console.error('Error inserting printer:', err)
            }
            resolve()
          }
        )
      })
    }

    // Add sample products
    const sampleProducts = [
      {
        product_name: "Phone Stand",
        sku: "PS001",
        category: "Accessories",
        print_time: 2.5,
        weight: 50,
        printer_type: "FDM"
      },
      {
        product_name: "Keychain",
        sku: "KC001",
        category: "Accessories",
        print_time: 1.0,
        weight: 20,
        printer_type: "FDM"
      },
      {
        product_name: "Vase",
        sku: "VS001",
        category: "Home Decor",
        print_time: 8.0,
        weight: 200,
        printer_type: "FDM"
      }
    ]

    for (const product of sampleProducts) {
      await new Promise<void>((resolve, reject) => {
        database.run(
          `INSERT INTO products (product_name, sku, category, print_time, weight, printer_type, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [product.product_name, product.sku, product.category, product.print_time, product.weight, product.printer_type],
          function(err) {
            if (err) {
              console.error('Error inserting product:', err)
            }
            resolve()
          }
        )
      })
    }

    // Add sample orders
    const sampleOrders = [
      {
        order_id: "ORD001",
        customer_name: "John Doe",
        customer_email: "john@example.com",
        source: "Website",
        total_quantity: 2,
        total_amount: 45.00,
        status: "Delivered"
      },
      {
        order_id: "ORD002",
        customer_name: "Jane Smith",
        customer_email: "jane@example.com",
        source: "Etsy",
        total_quantity: 1,
        total_amount: 25.00,
        status: "Shipped"
      },
      {
        order_id: "ORD003",
        customer_name: "Bob Johnson",
        customer_email: "bob@example.com",
        source: "Website",
        total_quantity: 3,
        total_amount: 75.00,
        status: "New"
      }
    ]

    for (const order of sampleOrders) {
      await new Promise<void>((resolve, reject) => {
        database.run(
          `INSERT INTO orders (order_id, customer_name, customer_email, source, total_quantity, total_amount, status, order_date, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, date('now'), datetime('now'), datetime('now'))`,
          [order.order_id, order.customer_name, order.customer_email, order.source, order.total_quantity, order.total_amount, order.status],
          function(err) {
            if (err) {
              console.error('Error inserting order:', err)
            }
            resolve()
          }
        )
      })
    }

    // Add sample expenses
    const sampleExpenses = [
      {
        expense_type: "Materials",
        amount: 150.00,
        description: "PLA filament purchase",
        vendor: "Filament Supplier"
      },
      {
        expense_type: "Electricity",
        amount: 75.00,
        description: "Monthly electricity bill",
        vendor: "Power Company"
      },
      {
        expense_type: "Maintenance",
        amount: 50.00,
        description: "Printer maintenance parts",
        vendor: "Hardware Store"
      }
    ]

    for (const expense of sampleExpenses) {
      await new Promise<void>((resolve, reject) => {
        database.run(
          `INSERT INTO expenses (expense_type, amount, description, vendor, date, created_at, updated_at) 
           VALUES (?, ?, ?, ?, date('now'), datetime('now'), datetime('now'))`,
          [expense.expense_type, expense.amount, expense.description, expense.vendor],
          function(err) {
            if (err) {
              console.error('Error inserting expense:', err)
            }
            resolve()
          }
        )
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Sample data added successfully" 
    })
  } catch (error) {
    console.error("Sample data creation error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create sample data" 
      },
      { status: 500 }
    )
  }
} 