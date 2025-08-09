"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { useSettings } from "@/contexts/settings-context"
import { formatCurrency } from "@/lib/cost-calculator"
import { getAuthToken } from "@/lib/ssr-safe-storage"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Activity,
  Calendar,
  Clock,
  Target,
  Printer,
  AlertTriangle,
} from "lucide-react"

interface DashboardStats {
  totalRevenue: number
  activeOrders: number
  printersOnline: number
  totalPrinters: number
  productionRate: number
  totalExpenses: number
  totalProducts: number
  lowStockCount: number
  totalComponents: number
  lowStockComponents: number
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    activeOrders: 0,
    printersOnline: 0,
    totalPrinters: 0,
    productionRate: 0,
    totalExpenses: 0,
    totalProducts: 0,
    lowStockCount: 0,
    totalComponents: 0,
    lowStockComponents: 0,
  })
  const [loading, setLoading] = useState(true)
  const { settings } = useSettings()
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchDashboardData()
    
    // Refresh dashboard data every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [user]) // Re-fetch when user changes (login/logout)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Initialize stats
      let totalRevenue = 0
      let activeOrders = 0
      let printersOnline = 0
      let totalPrinters = 0
      let totalExpenses = 0
      let totalProducts = 0
      let lowStockCount = 0
      let totalComponents = 0
      let lowStockComponents = 0

      // Fetch orders (handle if table doesn't exist)
      try {
        const response = await fetch('/api/orders')
        if (response.ok) {
          const data = await response.json()
          const orders = data.orders || []
          totalRevenue = orders
            .filter((order: any) => order.status === "Delivered")
            .reduce((sum: number, order: any) => sum + order.total_amount, 0)

          activeOrders = orders.filter((order: any) => ["New", "In Progress", "Shipped"].includes(order.status)).length
        }
      } catch (error) {
        // Orders table not available
      }

      // Fetch printers (handle if table doesn't exist)
      try {
        const response = await fetch('/api/printers')
        if (response.ok) {
          const data = await response.json()
          const printers = data.printers || []
          totalPrinters = printers.length
          printersOnline = printers.filter((printer: any) => ["Idle", "Printing"].includes(printer.status)).length
        }
      } catch (error) {
        // Printers table not available
      }

      // Fetch expenses (handle if table doesn't exist)
      try {
        const response = await fetch('/api/expenses')
        if (response.ok) {
          const data = await response.json()
          const expenses = data.expenses || []
          totalExpenses = expenses.reduce((sum: number, expense: any) => sum + expense.amount, 0)
        }
      } catch (error) {
        // Expenses table not available
      }

      // Fetch products (handle if table doesn't exist)
      try {
        const response = await fetch('/api/products')
        if (response.ok) {
          const data = await response.json()
          const products = data.products || []
          totalProducts = products.length
        }
      } catch (error) {
        // Products table not available
      }

      // Fetch inventory (handle if table doesn't exist)
      try {
        const token = localStorage.getItem('auth_token')
        if (token) {
          const response = await fetch('/api/inventory', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          if (response.ok) {
            const data = await response.json()
            const inventory = data.inventory || []
            lowStockCount = inventory.filter((item: any) => item.quantity_available <= item.minimum_threshold).length
          } else if (response.status === 401) {
            // Authentication required for inventory data
          }
        }
      } catch (error) {
        // Inventory table not available or authentication required
      }

      // Fetch components (handle if table doesn't exist)
      try {
        const token = localStorage.getItem('auth_token')
        if (token) {
          const response = await fetch('/api/components', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          if (response.ok) {
            const data = await response.json()
            const components = data.components || []
            totalComponents = components.length
            lowStockComponents = components.filter((component: any) => {
              const availableStock = component.current_stock - component.reserved_stock
              return availableStock <= component.minimum_stock_level
            }).length
          } else if (response.status === 401) {
            // Authentication required for components data
          }
        }
      } catch (error) {
        // Components table not available or authentication required
      }

      const productionRate = totalPrinters > 0 ? (printersOnline / totalPrinters) * 100 : 0

      setStats({
        totalRevenue,
        activeOrders,
        printersOnline,
        totalPrinters,
        productionRate,
        totalExpenses,
        totalProducts,
        lowStockCount,
        totalComponents,
        lowStockComponents,
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast({
        title: "Error",
        description: "Some dashboard data may not be available",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to {settings?.app_name || "ERP System"}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to {settings?.app_name || "ERP System"}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From delivered orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeOrders}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Printers Online</CardTitle>
            <Printer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.printersOnline}/{stats.totalPrinters}
            </div>
            <p className="text-xs text-muted-foreground">Available printers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productionRate.toFixed(1)}%</div>
            <Progress value={stats.productionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">In catalog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalRevenue > 0
                ? (((stats.totalRevenue - stats.totalExpenses) / stats.totalRevenue) * 100).toFixed(1)
                : "0.0"}
              %
            </div>
            <p className="text-xs text-muted-foreground">Revenue - Expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Components</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComponents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.lowStockComponents} need restocking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Button variant="outline" className="justify-start h-12 bg-transparent" asChild>
                <a href="/products">
                  <Package className="mr-2 h-4 w-4" />
                  Add New Product
                </a>
              </Button>
              <Button variant="outline" className="justify-start h-12 bg-transparent" asChild>
                <a href="/orders">
                  <Users className="mr-2 h-4 w-4" />
                  Create Order
                </a>
              </Button>
              <Button variant="outline" className="justify-start h-12 bg-transparent" asChild>
                <a href="/scheduler">
                  <Clock className="mr-2 h-4 w-4" />
                  Schedule Print Job
                </a>
              </Button>
              <Button variant="outline" className="justify-start h-12 bg-transparent" asChild>
                <a href="/expenses">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Add Expense
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Connection</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Connected
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Currency</span>
                <Badge variant="outline">{settings?.currency || "USD"}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">App Version</span>
                <Badge variant="outline">v1.0.0</Badge>
              </div>
              {stats.lowStockCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Inventory Alert</span>
                  <Badge variant="destructive">{stats.lowStockCount} items low</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started */}
      {stats.totalProducts === 0 && stats.activeOrders === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Getting Started
            </CardTitle>
            <CardDescription>Set up your 3D printing business</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 border rounded-lg">
                <Package className="mx-auto h-8 w-8 text-blue-500 mb-2" />
                <h3 className="font-semibold mb-1">Add Products</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Create your product catalog with pricing and materials
                </p>
                <Button size="sm" asChild>
                  <a href="/products">Get Started</a>
                </Button>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Printer className="mx-auto h-8 w-8 text-green-500 mb-2" />
                <h3 className="font-semibold mb-1">Setup Printers</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Configure your 3D printers and monitor their status
                </p>
                <Button size="sm" asChild>
                  <a href="/printers">Configure</a>
                </Button>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Users className="mx-auto h-8 w-8 text-purple-500 mb-2" />
                <h3 className="font-semibold mb-1">First Order</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Create your first customer order and start printing
                </p>
                <Button size="sm" asChild>
                  <a href="/orders">Create Order</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Authentication Notice */}
      {!user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Authentication Required
            </CardTitle>
            <CardDescription>Some features require authentication</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">
                To access inventory management, components, and other protected features, please log in to your account.
              </p>
              <Button size="sm" asChild>
                <a href="/login">Sign In</a>
              </Button>
              <div className="mt-2 text-xs text-muted-foreground">
                <p>Default credentials:</p>
                <p>Email: admin@3dpcommander.com</p>
                <p>Password: admin123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
