"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, CheckCircle } from "lucide-react"
import { InventoryFormModal } from "@/components/inventory-form-modal"
import { type InventoryItem } from "@/lib/local-db"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

export function InventoryPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [inventory, setInventory] = React.useState<InventoryItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [typeFilter, setTypeFilter] = React.useState("all")
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<InventoryItem | null>(null)

  const loadInventory = React.useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in to access inventory",
          variant: "destructive",
        })
        return
      }

      const response = await fetch('/api/inventory', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory')
      }
      
      const data = await response.json()
      setInventory(data.inventory || [])
    } catch (error) {
      console.error("Error loading inventory:", error)
      toast({
        title: "Error loading inventory",
        description: "Failed to load inventory from database.",
        variant: "destructive",
      })
      // Set empty array as fallback
      setInventory([])
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    loadInventory()
  }, [loadInventory])

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const handleDelete = async (item: InventoryItem) => {
    if (!confirm(`Are you sure you want to delete "${item.material_name}"?`)) return

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`/api/inventory/${item.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete inventory item')
      }

      toast({ title: "Inventory item deleted successfully!" })
      loadInventory()
    } catch (error: any) {
      console.error("Error deleting inventory item:", error)
      toast({
        title: "Error deleting inventory item",
        description: error.message || "Please try again later.",
        variant: "destructive",
      })
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingItem(null)
  }

  const handleModalSuccess = () => {
    loadInventory()
  }

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      (item.material_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.material_type || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.supplier || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    const matchesType = typeFilter === "all" || item.material_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const materialTypes = Array.from(new Set(inventory.map((item) => item.material_type).filter(Boolean)))
  const lowStockCount = inventory.filter((item) => item.status === "Low").length
  const outOfStockCount = inventory.filter((item) => item.status === "Out").length
  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity_available / 1000) * item.price_per_kg, 0)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Normal":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "Low":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "Out":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Normal":
        return <Badge className="bg-green-100 text-green-800">Normal</Badge>
      case "Low":
        return <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>
      case "Out":
        return <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Inventory</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Loading inventory...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Inventory</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Authentication Required
            </CardTitle>
            <CardDescription>Inventory management requires authentication</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center p-4 border rounded-lg">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-muted-foreground mb-3">
                To access inventory management features, please log in to your account.
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">Manage your 3D printing materials and supplies</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Material
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Material Inventory</CardTitle>
          <CardDescription>Track your 3D printing materials and supplies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Low">Low Stock</SelectItem>
                <SelectItem value="Out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {materialTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredInventory.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No materials found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by adding your first material."}
              </p>
              {!searchTerm && statusFilter === "all" && typeFilter === "all" && (
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Material
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price/kg</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Min Threshold</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(item.status)}
                        {getStatusBadge(item.status)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.material_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.material_type}</Badge>
                    </TableCell>
                    <TableCell>{item.color}</TableCell>
                    <TableCell>{item.quantity_available}g</TableCell>
                    <TableCell>${item.price_per_kg.toFixed(2)}</TableCell>
                    <TableCell>{item.supplier}</TableCell>
                    <TableCell>{item.minimum_threshold}g</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <InventoryFormModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        item={editingItem}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}
