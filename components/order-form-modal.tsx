"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface OrderFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order?: any | null // Changed from Order to any as per edit hint
  onSave: () => void
}

export function OrderFormModal({ open, onOpenChange, order, onSave }: OrderFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<any[]>([]) // Changed from Product to any as per edit hint
  const [formData, setFormData] = useState({
    order_id: "",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    source: "",
    status: "New" as const,
    tracking_number: "",
    shipping_address: "",
    notes: "",
    order_date: new Date().toISOString().split("T")[0],
  })
  const [orderedProducts, setOrderedProducts] = useState<any[]>([]) // Changed from OrderProduct to any as per edit hint
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchProducts()
      if (order) {
        setFormData({
          order_id: order.order_id,
          customer_name: order.customer_name,
          customer_email: order.customer_email || "",
          customer_phone: order.customer_phone || "",
          source: order.source,
          status: order.status,
          tracking_number: order.tracking_number || "",
          shipping_address: order.shipping_address || "",
          notes: order.notes || "",
          order_date: order.order_date.split("T")[0],
        })
        // Ensure ordered_products is properly parsed and has the correct structure
        let parsedProducts = order.ordered_products
        if (typeof parsedProducts === 'string') {
          try {
            parsedProducts = JSON.parse(parsedProducts)
          } catch (error) {
            console.error('Error parsing ordered_products:', error)
            parsedProducts = []
          }
        }
        
        // Ensure each product has the required fields for the form
        const formattedProducts = parsedProducts.map((product: any) => ({
          product_id: product.product_id || product.id || '',
          product_name: product.product_name || product.name || '',
          sku: product.sku || '',
          quantity: product.quantity || 1,
          unit_price: product.unit_price || product.price || 50,
          total_price: product.total_price || (product.quantity * (product.unit_price || 50)),
        }))
        
        setOrderedProducts(formattedProducts)
      } else {
        // Reset form for new order
        setFormData({
          order_id: `ORD-${Date.now()}`,
          customer_name: "",
          customer_email: "",
          customer_phone: "",
          source: "",
          status: "New",
          tracking_number: "",
          shipping_address: "",
          notes: "",
          order_date: new Date().toISOString().split("T")[0],
        })
        setOrderedProducts([])
      }
    }
  }, [open, order])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products")
      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }
      
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      })
    }
  }

  const addProduct = () => {
    if (products.length === 0) {
      toast({
        title: "No Products",
        description: "Please add products first before creating orders",
        variant: "destructive",
      })
      return
    }

    // Let user select the first available product
    const firstProduct = products[0]
    const newProduct: any = {
      product_id: firstProduct.id.toString(), // Ensure it's a string to match Select value
      product_name: firstProduct.product_name,
      sku: firstProduct.sku,
      quantity: 1,
      unit_price: 50, // Default price - should be calculated from BOM
      total_price: 50,
      availability_status: null,
      availability_message: "",
    }
    setOrderedProducts([...orderedProducts, newProduct])
    
    // Check availability for the newly added product
    setTimeout(async () => {
      const availability = await checkProductAvailability(newProduct.product_id, newProduct.quantity)
      if (availability) {
        const updatedProducts = [...orderedProducts, newProduct]
        const lastIndex = updatedProducts.length - 1
        updatedProducts[lastIndex].availability_status = availability.availability_status
        updatedProducts[lastIndex].availability_message = getAvailabilityMessage(availability)
        setOrderedProducts(updatedProducts)
      }
    }, 100)
  }

  const checkProductAvailability = async (productId: string, quantity: number) => {
    try {
      const response = await fetch("/api/products/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: quantity,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to check availability")
      }

      const availability = await response.json()
      return availability
    } catch (error) {
      console.error("Error checking product availability:", error)
      return null
    }
  }

  const updateProduct = async (index: number, field: keyof any, value: any) => { // Changed from OrderProduct to any as per edit hint
    const updated = [...orderedProducts]
    updated[index] = { ...updated[index], [field]: value }

    // Update product details when product_id changes
    if (field === "product_id") {
      const product = products.find((p) => p.id === value)
      if (product) {
        updated[index].product_name = product.product_name
        updated[index].sku = product.sku
      }
    }

    // Recalculate total price when quantity or unit price changes
    if (field === "quantity" || field === "unit_price") {
      updated[index].total_price = updated[index].quantity * updated[index].unit_price
    }

    // Check availability when product_id or quantity changes
    if ((field === "product_id" || field === "quantity") && updated[index].product_id && updated[index].quantity) {
      const availability = await checkProductAvailability(updated[index].product_id, updated[index].quantity)
      if (availability) {
        updated[index].availability_status = availability.availability_status
        updated[index].availability_message = getAvailabilityMessage(availability)
      }
    }

    setOrderedProducts(updated)
  }

  const getAvailabilityMessage = (availability: any) => {
    if (availability.is_available) {
      return `✅ Available in stock (${availability.available_stock} units)`
    } else if (availability.has_production_in_progress) {
      const completionDate = new Date(availability.earliest_completion).toLocaleDateString()
      const completionTime = new Date(availability.earliest_completion).toLocaleTimeString()
      return `⏳ In production - Will be available by ${completionDate} at ${completionTime}`
    } else {
      return `❌ Out of stock - No production scheduled`
    }
  }

  const removeProduct = (index: number) => {
    setOrderedProducts(orderedProducts.filter((_, i) => i !== index))
  }

  const calculateTotals = () => {
    const totalQuantity = orderedProducts.reduce((sum, product) => sum + product.quantity, 0)
    const totalAmount = orderedProducts.reduce((sum, product) => sum + product.total_price, 0)
    return { totalQuantity, totalAmount }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (orderedProducts.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one product to the order",
        variant: "destructive",
      })
      return
    }

    if (!formData.customer_name || !formData.source) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Check availability for all products
    const unavailableProducts = orderedProducts.filter(product => 
      product.availability_status === 'out_of_stock'
    )

    if (unavailableProducts.length > 0) {
      const productNames = unavailableProducts.map(p => p.product_name).join(', ')
      toast({
        title: "Products Not Available",
        description: `The following products are out of stock: ${productNames}. Please check availability before proceeding.`,
        variant: "destructive",
      })
      return
    }

    // Check if any product quantity exceeds available stock
    const productsExceedingStock = orderedProducts.filter(product => 
      product.availability_status === 'available' && product.quantity > (product.available_stock || 0)
    )

    if (productsExceedingStock.length > 0) {
      const productNames = productsExceedingStock.map(p => `${p.product_name} (${p.quantity} requested, ${p.available_stock} available)`).join(', ')
      toast({
        title: "Quantity Exceeds Available Stock",
        description: `The following products have insufficient stock: ${productNames}. Please reduce quantities or wait for more stock.`,
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required for saving orders.",
          variant: "destructive",
        })
        return
      }

      const { totalQuantity, totalAmount } = calculateTotals()

      const orderData = {
        ...formData,
        ordered_products: orderedProducts,
        total_quantity: totalQuantity,
        total_amount: totalAmount,
      }

      let response
      if (order) {
        // Update existing order
        response = await fetch(`/api/orders/${order.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(orderData),
        })
      } else {
        // Create new order
        response = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(orderData),
        })
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save order")
      }

      const result = await response.json()

      toast({
        title: order ? "Order updated" : "Order created",
        description: `${orderData.order_id} has been ${order ? "updated" : "created"} successfully.`,
      })
      onSave()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error saving order:", error)
      toast({
        title: "Error saving order",
        description: error.message || "Failed to save order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const { totalQuantity, totalAmount } = calculateTotals()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? "Edit Order" : "Create New Order"}</DialogTitle>
          <DialogDescription>
            {order ? "Update order details and products" : "Add a new customer order to the system"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="order_id">Order ID</Label>
                  <Input
                    id="order_id"
                    value={formData.order_id}
                    onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order_date">Order Date</Label>
                  <Input
                    id="order_date"
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Customer Name *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_email">Customer Email</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer_phone">Customer Phone</Label>
                  <Input
                    id="customer_phone"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source *</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(value) => setFormData({ ...formData, source: value })}
                    name="source"
                  >
                    <SelectTrigger id="source">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Website">Website</SelectItem>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="TikTok">TikTok</SelectItem>
                      <SelectItem value="Facebook">Facebook</SelectItem>
                      <SelectItem value="Etsy">Etsy</SelectItem>
                      <SelectItem value="Direct">Direct</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                    name="status"
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Shipped">Shipped</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tracking_number">Tracking Number</Label>
                  <Input
                    id="tracking_number"
                    value={formData.tracking_number}
                    onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipping_address">Shipping Address</Label>
                <Textarea
                  id="shipping_address"
                  value={formData.shipping_address}
                  onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Products
                <Button type="button" onClick={addProduct} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderedProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No products added yet. Click "Add Product" to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orderedProducts.map((product, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Product {index + 1}</h4>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeProduct(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-5" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                        <div className="space-y-2">
                          <Label>Product</Label>
                          <Select
                            value={product.product_id?.toString() || ""}
                            onValueChange={(value) => updateProduct(index, "product_id", value)}
                            name={`product-${index}`}
                          >
                            <SelectTrigger id={`product-${index}`}>
                              <SelectValue placeholder="Select a product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                  {p.product_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Available Stock</Label>
                          <div className={`flex items-center h-10 px-3 py-2 border rounded-md ${
                            product.availability_status === 'available' 
                              ? 'bg-green-50 border-green-200 text-green-700' 
                              : product.availability_status === 'in_production'
                              ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                              : 'bg-red-50 border-red-200 text-red-700'
                          }`}>
                            {product.availability_status === 'available' 
                              ? `${product.available_stock || 0} units in stock`
                              : product.availability_status === 'in_production'
                              ? 'In production'
                              : 'Out of stock'
                            }
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Quantity</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateProduct(index, "quantity", Math.max(1, product.quantity - 1))}
                              disabled={product.availability_status === 'out_of_stock'}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              id={`quantity-${index}`}
                              name={`quantity-${index}`}
                              type="number"
                              min="1"
                              value={product.quantity}
                              onChange={(e) => updateProduct(index, "quantity", Number.parseInt(e.target.value) || 1)}
                              className={`text-center ${
                                product.availability_status === 'available' && product.quantity > (product.available_stock || 0)
                                  ? 'border-red-500 bg-red-50'
                                  : ''
                              }`}
                              disabled={product.availability_status === 'out_of_stock'}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateProduct(index, "quantity", product.quantity + 1)}
                              disabled={product.availability_status === 'out_of_stock'}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          {product.availability_status === 'available' && product.quantity > (product.available_stock || 0) && (
                            <div className="text-xs text-red-600 mt-1">
                              ⚠️ Quantity exceeds available stock
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Unit Price</Label>
                          <Input
                            id={`unit-price-${index}`}
                            name={`unit-price-${index}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={product.unit_price}
                            onChange={(e) => updateProduct(index, "unit_price", Number.parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Total Price</Label>
                          <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted">
                            {product.total_price}
                          </div>
                        </div>
                      </div>
                      {product.availability_message && (
                        <div className="mt-3">
                          <div className={`p-3 rounded-md text-sm ${
                            product.availability_status === 'available' 
                              ? 'bg-green-50 text-green-700 border border-green-200' 
                              : product.availability_status === 'in_production'
                              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {product.availability_message}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Order Summary */}
              {orderedProducts.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span>Total Quantity:</span>
                    <Badge variant="outline">{totalQuantity}</Badge>
                  </div>
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total Amount:</span>
                    <span className="text-lg">{totalAmount}</span> {/* Removed formatCurrency */}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : order ? "Update Order" : "Create Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
