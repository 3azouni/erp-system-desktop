"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Line,
  Area,
  AreaChart,
} from "recharts"
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, Users, Download } from "lucide-react"

interface AnalyticsData {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  revenueGrowth: number
  ordersGrowth: number
  monthlyRevenue: Array<{ month: string; revenue: number; orders: number }>
  productSales: Array<{ name: string; sales: number; revenue: number }>
  costBreakdown: Array<{ name: string; value: number; color: string }>
  printerUtilization: Array<{ printer: string; utilization: number; hours: number }>
}

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("6months")
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    revenueGrowth: 0,
    ordersGrowth: 0,
    monthlyRevenue: [],
    productSales: [],
    costBreakdown: [],
    printerUtilization: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()

      switch (timeRange) {
        case "1month":
          startDate.setMonth(endDate.getMonth() - 1)
          break
        case "3months":
          startDate.setMonth(endDate.getMonth() - 3)
          break
        case "6months":
          startDate.setMonth(endDate.getMonth() - 6)
          break
        case "1year":
          startDate.setFullYear(endDate.getFullYear() - 1)
          break
      }

      console.log('Date range:', { startDate, endDate, timeRange })

      // Fetch real data from APIs
      const [ordersResponse, productsResponse, expensesResponse, printersResponse] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/products"),
        fetch("/api/expenses"),
        fetch("/api/printers")
      ])

      console.log('API responses:', {
        orders: ordersResponse.status,
        products: productsResponse.status,
        expenses: expensesResponse.status,
        printers: printersResponse.status
      })

      const orders = ordersResponse.ok ? (await ordersResponse.json()).orders : []
      const products = productsResponse.ok ? (await productsResponse.json()).products : []
      const expenses = expensesResponse.ok ? (await expensesResponse.json()).expenses : []
      const printers = printersResponse.ok ? (await printersResponse.json()).printers : []

      console.log('Analytics data loaded:', { orders, products, expenses, printers })

      // Calculate growth based on real data
      const currentPeriodOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.created_at || order.order_date || new Date())
        return orderDate >= startDate && orderDate <= endDate
      })
      
      // Calculate metrics
      const totalRevenue = currentPeriodOrders?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0
      const totalOrders = currentPeriodOrders?.length || 0
      const totalProducts = products?.length || 0
      const uniqueCustomers = new Set(currentPeriodOrders?.map((order: any) => order.customer_name)).size
      
      const previousPeriodStart = new Date(startDate)
      const previousPeriodEnd = new Date(startDate)
      previousPeriodStart.setMonth(previousPeriodStart.getMonth() - (timeRange === "1month" ? 1 : timeRange === "3months" ? 3 : timeRange === "6months" ? 6 : 12))
      previousPeriodEnd.setMonth(previousPeriodEnd.getMonth() - (timeRange === "1month" ? 1 : timeRange === "3months" ? 3 : timeRange === "6months" ? 6 : 12))
      
      const previousPeriodOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.created_at || order.order_date || new Date())
        return orderDate >= previousPeriodStart && orderDate <= previousPeriodEnd
      })
      
      const currentRevenue = currentPeriodOrders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0)
      const previousRevenue = previousPeriodOrders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0)
      const currentOrdersCount = currentPeriodOrders.length
      const previousOrdersCount = previousPeriodOrders.length
      
      const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0
      const ordersGrowth = previousOrdersCount > 0 ? ((currentOrdersCount - previousOrdersCount) / previousOrdersCount) * 100 : 0

      // Generate monthly revenue data
      const monthlyRevenue = generateMonthlyData(currentPeriodOrders || [], timeRange)

      // Generate product sales data
      const productSales = generateProductSalesData(currentPeriodOrders || [], products || [])

      // Generate cost breakdown from real expense data
      const currentPeriodExpenses = expenses.filter((expense: any) => {
        const expenseDate = new Date(expense.date || expense.created_at || new Date())
        return expenseDate >= startDate && expenseDate <= endDate
      })
      
      const totalExpenses = currentPeriodExpenses.reduce((sum: number, expense: any) => sum + expense.amount, 0)
      
      // Group expenses by type
      const expensesByType = currentPeriodExpenses.reduce((acc: Record<string, number>, expense: any) => {
        acc[expense.expense_type] = (acc[expense.expense_type] || 0) + expense.amount
        return acc
      }, {} as Record<string, number>)
      
      const costBreakdown = Object.entries(expensesByType).map(([type, amount], index) => {
        const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00", "#ff0000", "#0000ff"]
        return {
          name: type,
          value: amount as number,
          color: colors[index % colors.length]
        }
      })

      // Generate printer utilization data from real printer data
      const printerUtilization = printers?.map((printer: any) => ({
        printer: printer.printer_name || 'Unknown Printer',
        utilization: printer.hours_printed > 0 ? Math.min((printer.hours_printed / 720) * 100, 100) : 0, // Assuming 720 hours per month (30 days * 24 hours)
        hours: printer.hours_printed || 0,
      })) || []

      setAnalytics({
        totalRevenue,
        totalOrders,
        totalProducts,
        totalCustomers: uniqueCustomers,
        revenueGrowth,
        ordersGrowth,
        monthlyRevenue,
        productSales,
        costBreakdown,
        printerUtilization,
      })
    } catch (error) {
      console.error("Error loading analytics:", error)
      // Set default values if there's an error
      setAnalytics({
        totalRevenue: 0,
        totalOrders: 0,
        totalProducts: 0,
        totalCustomers: 0,
        revenueGrowth: 0,
        ordersGrowth: 0,
        monthlyRevenue: [],
        productSales: [],
        costBreakdown: [],
        printerUtilization: [],
      })
    } finally {
      setLoading(false)
    }
  }

  const generateMonthlyData = (orders: any[], range: string) => {
    const months = []
    const endDate = new Date()
    const numMonths = range === "1month" ? 1 : range === "3months" ? 3 : range === "6months" ? 6 : 12

    for (let i = numMonths - 1; i >= 0; i--) {
      const date = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1)
      const monthName = date.toLocaleDateString("en-US", { month: "short" })

      const monthOrders = orders.filter((order) => {
        const orderDate = new Date(order.created_at || order.order_date || new Date())
        return orderDate.getMonth() === date.getMonth() && orderDate.getFullYear() === date.getFullYear()
      })

      months.push({
        month: monthName,
        revenue: monthOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
        orders: monthOrders.length,
      })
    }

    return months
  }

  const generateProductSalesData = (orders: any[], products: any[]) => {
    const productSales = new Map()

    orders.forEach((order) => {
      // Parse ordered_products from the order
      let orderedProducts = []
      if (order.ordered_products) {
        if (typeof order.ordered_products === 'string') {
          try {
            orderedProducts = JSON.parse(order.ordered_products)
          } catch (error) {
            console.error('Error parsing ordered_products:', error)
            orderedProducts = []
          }
        } else if (Array.isArray(order.ordered_products)) {
          orderedProducts = order.ordered_products
        }
      }

      // Process each product in the order
      orderedProducts.forEach((orderedProduct: any) => {
        const productName = orderedProduct.name || orderedProduct.product_name || 'Unknown Product'
        const productQuantity = orderedProduct.quantity || 1
        const productPrice = orderedProduct.price || 0
        const productRevenue = productQuantity * productPrice

        const existing = productSales.get(productName) || { sales: 0, revenue: 0 }
        productSales.set(productName, {
          sales: existing.sales + productQuantity,
          revenue: existing.revenue + productRevenue,
        })
      })
    })

    return Array.from(productSales.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }

  const exportData = () => {
    const csvContent = [
      ["Metric", "Value"],
      ["Total Revenue", `$${analytics.totalRevenue.toFixed(2)}`],
      ["Total Orders", analytics.totalOrders.toString()],
      ["Total Products", analytics.totalProducts.toString()],
      ["Total Customers", analytics.totalCustomers.toString()],
      ["Revenue Growth", `${analytics.revenueGrowth.toFixed(1)}%`],
      ["Orders Growth", `${analytics.ordersGrowth.toFixed(1)}%`],
      ...analytics.monthlyRevenue.map((item) => [item.month, `$${item.revenue.toFixed(2)}`]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-${timeRange}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your business performance and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">1 Month</SelectItem>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportData} variant="outline" size="sm" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold break-words">
              ${analytics.totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analytics.revenueGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={analytics.revenueGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                {analytics.revenueGrowth >= 0 ? "+" : ""}
                {analytics.revenueGrowth.toFixed(1)}%
              </span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold break-words">
              {analytics.totalOrders.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analytics.ordersGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={analytics.ordersGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                {analytics.ordersGrowth >= 0 ? "+" : ""}
                {analytics.ordersGrowth.toFixed(1)}%
              </span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold break-words">
              {analytics.totalProducts.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Active products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold break-words">
              {analytics.totalCustomers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Unique customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          <TabsTrigger value="printers">Printer Utilization</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue & Orders</CardTitle>
              <CardDescription>Revenue and order trends over the selected time period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "revenue" ? `$${value}` : value,
                      name === "revenue" ? "Revenue" : "Orders",
                    ]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  <Line type="monotone" dataKey="orders" stroke="#82ca9d" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Products by Revenue</CardTitle>
              <CardDescription>Best performing products in the selected time period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.productSales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
              <CardDescription>Distribution of expenses by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.costBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.costBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value}`, "Amount"]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="printers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Printer Utilization</CardTitle>
              <CardDescription>Usage statistics for each 3D printer</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.printerUtilization}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="printer" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, "Utilization"]} />
                  <Bar dataKey="utilization" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
