"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Plus, Search, Edit, Trash2, Package, MoreHorizontal, AlertTriangle } from "lucide-react"
import { ComponentFormModal } from "@/components/component-form-modal"

interface Component {
  id: number
  component_name: string
  description?: string | null
  part_number?: string | null
  category: string
  cost: number
  supplier?: string | null
  minimum_stock_level: number
  serial_number_tracking: boolean
  current_stock: number
  reserved_stock: number
  created_at: string
  updated_at: string
}

const COMPONENT_CATEGORIES = [
  "Nozzle", "Build Plate", "Belt", "Fan", "Hotend", "Extruder", 
  "Motherboard", "Display", "Power Supply", "Stepper Motor", 
  "Endstop", "Thermistor", "Heater Cartridge", "PTFE Tube", "Other"
]

export function ComponentsPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [components, setComponents] = useState<Component[]>([])
  const [filteredComponents, setFilteredComponents] = useState<Component[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingComponent, setEditingComponent] = useState<Component | null>(null)

  // Load components function
  const loadComponents = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in to access components",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/components", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error("Failed to fetch components")
      }
      
      const data = await response.json()
      setComponents(data.components || [])
      
      // Check for low stock components and create notifications
      const lowStockComponents = data.components?.filter((component: Component) => {
        const availableStock = component.current_stock - component.reserved_stock
        return availableStock <= component.minimum_stock_level && availableStock > 0
      }) || []
      
      const outOfStockComponents = data.components?.filter((component: Component) => {
        const availableStock = component.current_stock - component.reserved_stock
        return availableStock <= 0
      }) || []
      
      // Create notifications for low stock components
      lowStockComponents.forEach(async (component: Component) => {
        try {
          await fetch('/api/notifications', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              title: 'Component Low Stock Alert',
              message: `Component "${component.component_name}" is running low on stock (${component.current_stock - component.reserved_stock} available).`,
              type: 'warning',
              data: { componentId: component.id, componentName: component.component_name }
            })
          })
        } catch (error) {
          console.error('Error creating low stock notification:', error)
        }
      })
      
      // Create notifications for out of stock components
      outOfStockComponents.forEach(async (component: Component) => {
        try {
          await fetch('/api/notifications', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              title: 'Component Out of Stock Alert',
              message: `Component "${component.component_name}" is out of stock!`,
              type: 'error',
              data: { componentId: component.id, componentName: component.component_name }
            })
          })
        } catch (error) {
          console.error('Error creating out of stock notification:', error)
        }
      })
    } catch (error) {
      console.error("Error loading components:", error)
      toast({
        title: "Error loading components",
        description: "Failed to load components from database.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load components on mount and when user changes
  useEffect(() => {
    if (user) {
      loadComponents()
    }
  }, [user, toast])



  // Filter components
  useEffect(() => {
    let filtered = components

    if (searchTerm) {
      filtered = filtered.filter((component) =>
        component.component_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        component.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        component.part_number?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== "All Categories") {
      filtered = filtered.filter((component) => component.category === selectedCategory)
    }

    setFilteredComponents(filtered)
  }, [components, searchTerm, selectedCategory])

  const handleEdit = (component: Component) => {
    setEditingComponent(component)
    setIsModalOpen(true)
  }

  const handleDelete = async (component: Component) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in to delete components",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/components/${component.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete component')
      }

      toast({
        title: "Success",
        description: "Component deleted successfully",
      })

      // Reload components
      await loadComponents()
    } catch (error) {
      console.error("Error deleting component:", error)
      toast({
        title: "Error",
        description: "Failed to delete component",
        variant: "destructive",
      })
    }
  }

  const getStockStatus = (component: Component) => {
    const availableStock = component.current_stock - component.reserved_stock
    if (availableStock <= 0) return "out"
    if (availableStock <= component.minimum_stock_level && availableStock > 0) return "low"
    return "normal"
  }

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case "out": return "bg-red-100 text-red-800"
      case "low": return "bg-yellow-100 text-yellow-800"
      default: return "bg-green-100 text-green-800"
    }
  }

  const getStockStatusText = (status: string) => {
    switch (status) {
      case "out": return "Out of Stock"
      case "low": return "Low Stock"
      default: return "In Stock"
    }
  }

  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalComponents = components.length
    const lowStockComponents = components.filter(c => getStockStatus(c) === "low").length
    const outOfStockComponents = components.filter(c => getStockStatus(c) === "out").length
    const totalValue = components.reduce((sum, c) => sum + (c.cost * c.current_stock), 0)

    return {
      totalComponents,
      lowStockComponents,
      outOfStockComponents,
      totalValue
    }
  }, [components])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Components & Parts</h1>
            <p className="text-muted-foreground">Manage printer components and replacement parts</p>
          </div>
        </div>
        <div className="text-center py-8">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Components & Parts</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Authentication Required
            </CardTitle>
            <CardDescription>Components management requires authentication</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center p-4 border rounded-lg">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-muted-foreground mb-3">
                To access components management features, please log in to your account.
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
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Components & Parts</h1>
          <p className="text-muted-foreground">Manage printer components and replacement parts</p>
        </div>
                 <div className="flex gap-2">
           <Button onClick={() => setIsModalOpen(true)}>
             <Plus className="mr-2 h-4 w-4" />
             Add Component
           </Button>
         </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Components</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComponents}</div>
            <p className="text-xs text-muted-foreground">All components</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <Package className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.lowStockComponents}</div>
            <p className="text-xs text-muted-foreground">Below threshold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <Package className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.outOfStockComponents}</div>
            <p className="text-xs text-muted-foreground">Need reorder</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Inventory value</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search components..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Categories">All Categories</SelectItem>
                  {COMPONENT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Components Table */}
      <Card>
        <CardHeader>
          <CardTitle>Components</CardTitle>
          <CardDescription>
            {filteredComponents.length} of {components.length} components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComponents.map((component) => {
                const stockStatus = getStockStatus(component)
                const availableStock = component.current_stock - component.reserved_stock
                
                return (
                  <TableRow key={component.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{component.component_name}</div>
                        {component.part_number && (
                          <div className="text-sm text-muted-foreground">{component.part_number}</div>
                        )}
                        {component.description && (
                          <div className="text-sm text-muted-foreground">{component.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{component.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className={getStockStatusColor(stockStatus)}>
                            {getStockStatusText(stockStatus)}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {availableStock} available / {component.current_stock} total
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono">${component.cost.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        Total: ${(component.cost * component.current_stock).toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{component.supplier || "Not specified"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(component)}
                          className="h-8 px-2"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(component)}
                          className="h-8 px-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {filteredComponents.length === 0 && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No components found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm || selectedCategory !== "All Categories"
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by adding your first component."}
              </p>
              {!searchTerm && selectedCategory === "All Categories" && (
                <Button onClick={() => setIsModalOpen(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Component
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Component Form Modal */}
      <ComponentFormModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open) {
            setEditingComponent(null)
          }
        }}
        component={editingComponent}
        onSuccess={() => {
          // Reload components
          loadComponents()
          setEditingComponent(null)
        }}
      />
    </div>
  )
} 