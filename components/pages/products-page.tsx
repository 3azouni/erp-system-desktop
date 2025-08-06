"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { ProductFormModal } from "@/components/product-form-modal"
import { Plus, Search, Filter, Download, Edit, Trash2, Package, Eye, Star, Clock, AlertCircle, MoreHorizontal } from "lucide-react"
import { useSettings } from "@/contexts/settings-context"

interface Product {
  id: string
  product_name: string
  sku: string
  category: string
  description: string
  print_time: number
  weight: number
  printer_type: string
  required_materials: string[]
  image_url: string
  price: number
  status: string
  created_at: string
  updated_at: string
}

const CATEGORIES = [
  "All Categories",
  "Miniatures",
  "Functional Parts",
  "Prototypes",
  "Decorative Items",
  "Tools & Accessories",
  "Educational Models",
  "Custom Parts",
]

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    Miniatures: "bg-purple-100 text-purple-800",
    "Functional Parts": "bg-blue-100 text-blue-800",
    Prototypes: "bg-orange-100 text-orange-800",
    "Decorative Items": "bg-pink-100 text-pink-800",
    "Tools & Accessories": "bg-green-100 text-green-800",
    "Educational Models": "bg-yellow-100 text-yellow-800",
    "Custom Parts": "bg-gray-100 text-gray-800",
  }
  return colors[category] || "bg-gray-100 text-gray-800"
}

export function ProductsPage() {
  const { toast } = useToast()
  const [products, setProducts] = React.useState<Product[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState("All Categories")
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null)
  const [dbConnected, setDbConnected] = React.useState(false)

  // Load products from API
  const loadProducts = React.useCallback(async () => {
    try {
      setLoading(true)

      const response = await fetch("/api/products")
      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }

      const data = await response.json()
      console.log('Products loaded from API:', data.products)
      
      // Debug each product's materials
      data.products.forEach((product: any, index: number) => {
        console.log(`Product ${index + 1} (${product.product_name}):`, {
          materials: product.required_materials,
          type: typeof product.required_materials,
          isArray: Array.isArray(product.required_materials),
          length: Array.isArray(product.required_materials) ? product.required_materials.length : 'N/A'
        })
      })
      
      setProducts(data.products || [])

      if (data.products.length === 0) {
        toast({
          title: "No products found",
          description: "Add your first product to get started.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error loading products:", error)
      toast({
        title: "Error loading products",
        description: "Failed to load products from database. Check console for details.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // Filter products based on search and category with comprehensive null checks
  const filteredProducts = React.useMemo(() => {
    if (!Array.isArray(products)) {
      return []
    }

    return products.filter((product) => {
      // Ensure product exists and has required properties
      if (!product || typeof product !== "object") {
        return false
      }

      // Safe string operations with comprehensive null/undefined checks
      const productName = (product.product_name || "").toString().toLowerCase()
      const sku = (product.sku || "").toString().toLowerCase()
      const category = (product.category || "").toString()
      const materials = Array.isArray(product.required_materials) ? product.required_materials : []

      // Safe search term conversion
      const searchLower = (searchTerm || "").toString().toLowerCase()

      const matchesSearch =
        searchLower === "" ||
        productName.includes(searchLower) ||
        sku.includes(searchLower) ||
        materials.some((material) => {
          if (!material || typeof material !== "string") return false
          return material.toLowerCase().includes(searchLower)
        })

      const matchesCategory = selectedCategory === "All Categories" || category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [products, searchTerm, selectedCategory])

  // Calculate statistics with comprehensive safety checks
  const stats = React.useMemo(() => {
    if (!Array.isArray(products)) {
      return {
        totalProducts: 0,
        totalPrintTime: 0,
        totalWeight: 0,
        categories: 0,
      }
    }

    const totalProducts = products.length
    const totalPrintTime = products.reduce((sum, product) => {
      const printTime = product?.print_time
      return sum + (typeof printTime === "number" && !isNaN(printTime) ? printTime : 0)
    }, 0)

    const totalWeight = products.reduce((sum, product) => {
      const weight = product?.weight
      return sum + (typeof weight === "number" && !isNaN(weight) ? weight : 0)
    }, 0)

    const categories = new Set(
      products.map((p) => p?.category).filter((cat) => cat && typeof cat === "string" && cat.trim() !== ""),
    ).size

    return {
      totalProducts,
      totalPrintTime: Math.round(totalPrintTime * 100) / 100,
      totalWeight,
      categories,
    }
  }, [products])

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const handleDelete = async (product: Product) => {
    if (!product?.id) {
      toast({
        title: "Error",
        description: "Invalid product selected for deletion.",
        variant: "destructive",
      })
      return
    }

    const productName = product.product_name || "this product"
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) {
      return
    }

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required for deletion.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete product")
      }

      // Remove from local state
      setProducts(products.filter((p) => p.id !== product.id))
      
      toast({
        title: "Product deleted",
        description: `${productName} has been deleted successfully.`,
      })
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error deleting product",
        description: "Failed to delete the product. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
  }

  const handleModalSuccess = () => {
    loadProducts()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">Manage your 3D printing product catalog</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">


      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your 3D printing product catalog</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">{stats.categories} categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Print Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPrintTime}h</div>
            <p className="text-xs text-muted-foreground">
              Avg: {stats.totalProducts > 0 ? (stats.totalPrintTime / stats.totalProducts).toFixed(1) : 0}h per product
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Weight</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWeight}g</div>
            <p className="text-xs text-muted-foreground">
              Avg: {stats.totalProducts > 0 ? Math.round(stats.totalWeight / stats.totalProducts) : 0}g per product
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories}</div>
            <p className="text-xs text-muted-foreground">Active product types</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
          <CardDescription>
            {selectedCategory !== "All Categories" && `Filtered by: ${selectedCategory}`}
            {searchTerm && ` • Search: "${searchTerm}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Materials</TableHead>
                  <TableHead>Print Time</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Printer Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm || selectedCategory !== "All Categories"
                          ? "No products match your filters"
                          : "No products found. Add your first product to get started."}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    // Additional safety check for each product in render
                    if (!product || !product.id) {
                      return null
                    }

                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <img
                              src={product.image_url || "/placeholder.svg?height=40&width=40"}
                              alt={product.product_name || "Product"}
                              className="h-10 w-10 rounded-md object-cover"
                            />
                            <div>
                              <div className="font-medium">{product.product_name || "Unnamed Product"}</div>
                              {product.description && (
                                <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                  {product.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">{product.sku || "No SKU"}</code>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(product.category || "")}>
                            {product.category || "Uncategorized"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(product.required_materials) && product.required_materials.length > 0 ? (
                              <>
                                {product.required_materials.slice(0, 2).map((material, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {material || "Unknown"}
                                  </Badge>
                                ))}
                                {product.required_materials.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{product.required_materials.length - 2}
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                No materials
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{product.print_time || 0}h</TableCell>
                        <TableCell>{product.weight || 0}g</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {product.printer_type || "Not specified"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEdit(product)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDelete(product)} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
        </CardContent>
      </Card>

      {/* Product Form Modal */}
      <ProductFormModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        product={editingProduct}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}
