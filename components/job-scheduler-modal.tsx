"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Clock, AlertTriangle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export interface PrintJob {
  id?: string
  job_id: string
  product_id: string
  product_name: string
  quantity: number
  assigned_printer_id: string
  assigned_printer_name: string
  estimated_time_hours: number
  total_estimated_time: number
  status: "Pending" | "Printing" | "Completed" | "Failed" | "Cancelled"
  priority: "Low" | "Normal" | "High" | "Urgent"
  customer_name?: string
  due_date?: string
  notes?: string
  started_at?: string
  completed_at?: string
  created_at?: string
  updated_at?: string
}

interface JobSchedulerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editingJob?: PrintJob | null
}

export function JobSchedulerModal({ open, onOpenChange, onSuccess, editingJob }: JobSchedulerModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [dataLoading, setDataLoading] = React.useState(false)
  const [products, setProducts] = React.useState<any[]>([])
  const [printers, setPrinters] = React.useState<any[]>([])
  const [inventory, setInventory] = React.useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = React.useState<any | null>(null)
  const [recommendedPrinter, setRecommendedPrinter] = React.useState<any | null>(null)
  const [materialAvailability, setMaterialAvailability] = React.useState<any[]>([])
  const [productAvailability, setProductAvailability] = React.useState<any>(null)

  const [formData, setFormData] = React.useState({
    product_id: "",
    quantity: "1",
    assigned_printer_id: "",
    priority: "Normal",
    customer_name: "",
    due_date: "",
    notes: "",
  })

  React.useEffect(() => {
    if (open) {
      loadData()
      if (editingJob) {
        // Populate form with existing job data
        setFormData({
          product_id: editingJob.product_id,
          quantity: editingJob.quantity.toString(),
          assigned_printer_id: editingJob.assigned_printer_id,
          priority: editingJob.priority || "Normal",
          customer_name: editingJob.customer_name || "",
          due_date: editingJob.due_date || "",
          notes: editingJob.notes || "",
        })
      } else {
        // Reset form for new job
        setFormData({
          product_id: "",
          quantity: "1",
          assigned_printer_id: "",
          priority: "Normal",
          customer_name: "",
          due_date: "",
          notes: "",
        })
      }
    }
  }, [open, editingJob])

  React.useEffect(() => {
    if (selectedProduct && formData.quantity && printers.length > 0) {
      findRecommendedPrinter()
      checkMaterialAvailability()
      checkProductAvailability()
    }
  }, [selectedProduct, formData.quantity, printers, inventory])

  const checkProductAvailability = async () => {
    if (!selectedProduct || !formData.quantity) return

    try {
      const response = await fetch("/api/products/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          quantity: parseInt(formData.quantity),
        }),
      })

      if (response.ok) {
        const availability = await response.json()
        setProductAvailability(availability)
      }
    } catch (error) {
      console.error("Error checking product availability:", error)
    }
  }

  const loadData = async () => {
    try {
      setDataLoading(true)

      const token = localStorage.getItem("auth_token")
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

      const [productsResponse, printersResponse, inventoryResponse] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/printers"),
        fetch("/api/inventory", { headers }),
      ])

      if (!productsResponse.ok) {
        throw new Error("Failed to fetch products")
      }

      if (!printersResponse.ok) {
        throw new Error("Failed to fetch printers")
      }

      const productsData = await productsResponse.json()
      const printersData = await printersResponse.json()
      const inventoryData = inventoryResponse.ok ? await inventoryResponse.json() : { inventory: [] }

      console.log('Products loaded:', productsData.products)
      console.log('Printers loaded:', printersData.printers)
      console.log('Inventory loaded:', inventoryData.inventory)

      setProducts(productsData.products || [])
      setPrinters(printersData.printers || [])
      setInventory(inventoryData.inventory || [])
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error loading data",
        description: "Failed to load products, printers, and inventory from database.",
        variant: "destructive",
      })
    } finally {
      setDataLoading(false)
    }
  }

  const findRecommendedPrinter = () => {
    if (!selectedProduct) return

    // Filter printers that can handle this product type and are available
    const availablePrinters = printers.filter(
      (printer) => printer.status !== "Maintenance" && printer.status !== "Offline",
    )

    if (availablePrinters.length === 0) {
      setRecommendedPrinter(null)
      setFormData((prev) => ({ ...prev, assigned_printer_id: "" }))
      return
    }

    // Sort by availability (idle first, then by queue length)
    const sortedPrinters = availablePrinters.sort((a, b) => {
      if (a.status === "Idle" && b.status !== "Idle") return -1
      if (b.status === "Idle" && a.status !== "Idle") return 1
      return (a.job_queue || 0) - (b.job_queue || 0)
    })

    setRecommendedPrinter(sortedPrinters[0])
    setFormData((prev) => ({ ...prev, assigned_printer_id: sortedPrinters[0].id.toString() }))
  }

  const checkMaterialAvailability = () => {
    if (!selectedProduct || !formData.quantity || !inventory.length) {
      setMaterialAvailability([])
      return
    }

    const requiredMaterials = selectedProduct.required_materials || []
    const quantity = parseInt(formData.quantity)
    const weightPerUnit = selectedProduct.weight || 0 // in grams
    const totalWeightRequired = quantity * weightPerUnit // keep in grams
    const availability = []

    for (const material of requiredMaterials) {
      // Find matching inventory items (case-insensitive)
      const matchingItems = inventory.filter(item => 
        item.material_name.toLowerCase().includes(material.toLowerCase()) ||
        material.toLowerCase().includes(item.material_name.toLowerCase())
      )

      if (matchingItems.length > 0) {
        const totalAvailable = matchingItems.reduce((sum, item) => sum + item.quantity_available, 0)
        const status = totalAvailable > 0 ? (totalAvailable >= totalWeightRequired ? 'Available' : 'Low') : 'Out'
        
        availability.push({
          material,
          available: totalAvailable,
          required: totalWeightRequired,
          status,
          items: matchingItems,
          weightPerUnit,
          totalWeightRequired
        })
      } else {
        availability.push({
          material,
          available: 0,
          required: totalWeightRequired,
          status: 'Not Found',
          items: [],
          weightPerUnit,
          totalWeightRequired
        })
      }
    }

    setMaterialAvailability(availability)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (field === "product_id") {
      const product = products.find((p) => p.id.toString() === value)
      setSelectedProduct(product || null)
    }
  }

  const calculateEstimatedTime = () => {
    if (!selectedProduct || !formData.quantity) return 0
    return (selectedProduct.print_time || 0) * Number.parseInt(formData.quantity)
  }

  const generateJobId = () => {
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.random().toString(36).substring(2, 5).toUpperCase()
    return `JOB-${timestamp}-${random}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!selectedProduct || !recommendedPrinter) {
        throw new Error("Please select a product and ensure a printer is available")
      }

      // Check material availability
      const insufficientMaterials = materialAvailability.filter(item => 
        item.status === 'Out' || item.status === 'Not Found' || 
        (item.status === 'Low' && item.available < item.required)
      )

      if (insufficientMaterials.length > 0) {
        const materialNames = insufficientMaterials.map(item => item.material).join(', ')
        throw new Error(`Insufficient materials: ${materialNames}. Please check inventory before scheduling.`)
      }

      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("Authentication required")
      }

      if (editingJob) {
        // Update existing job
        const response = await fetch(`/api/print-jobs/${editingJob.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            product_id: parseInt(formData.product_id),
            printer_id: parseInt(formData.assigned_printer_id),
            quantity: parseInt(formData.quantity),
            estimated_print_time: selectedProduct.print_time || 0,
            priority: formData.priority,
            customer_name: formData.customer_name || null,
            due_date: formData.due_date || null,
            notes: formData.notes || null,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to update print job")
        }

        toast({
          title: "Job updated successfully!",
          description: `Job ${editingJob.job_id} has been updated.`,
        })
      } else {
        // Create new job
        const jobId = generateJobId()
        const estimatedTime = calculateEstimatedTime()

        const response = await fetch("/api/print-jobs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            product_id: parseInt(formData.product_id),
            printer_id: parseInt(formData.assigned_printer_id),
            quantity: parseInt(formData.quantity),
            estimated_print_time: selectedProduct.print_time || 0,
            status: "Pending"
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to create print job")
        }

        toast({
          title: "Job scheduled successfully!",
          description: `Job ${jobId} has been added to the queue.`,
        })
      }

      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (error: any) {
      console.error("Error scheduling job:", error)
      toast({
        title: "Error scheduling job",
        description: error.message || "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      product_id: "",
      quantity: "1",
      assigned_printer_id: "",
      priority: "Normal",
      customer_name: "",
      due_date: "",
      notes: "",
    })
    setSelectedProduct(null)
    setRecommendedPrinter(null)
  }

  const getAvailablePrinters = () => {
    return printers.filter((printer) => printer.status !== "Maintenance" && printer.status !== "Offline")
  }

  const getPrinterStatusColor = (status: string) => {
    switch (status) {
      case "Idle":
        return "bg-green-100 text-green-800"
      case "Printing":
        return "bg-blue-100 text-blue-800"
      case "Maintenance":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (dataLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Schedule New Print Job</DialogTitle>
            <DialogDescription>Loading products and printers...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">Loading...</div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingJob ? `Edit Print Job - ${editingJob.job_id}` : "Schedule New Print Job"}</DialogTitle>
          <DialogDescription>
            {editingJob 
              ? "Update the job details and reassign to an available printer"
              : "Select a product and quantity, then assign to an available printer for production"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Job Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product_id">Product *</Label>
                <Select value={formData.product_id} onValueChange={(value) => handleInputChange("product_id", value)} name="product_id">
                  <SelectTrigger id="product_id">
                    <SelectValue placeholder="Select product to print" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{product.product_name}</span>
                          <Badge variant="outline" className="ml-2">
                            {product.sku}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange("quantity", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                    <SelectTrigger id="priority" name="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => handleInputChange("customer_name", e.target.value)}
                  placeholder="Optional customer name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleInputChange("due_date", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Additional job notes..."
                />
              </div>
            </div>

            {/* Right Column - Product Info & Printer Assignment */}
            <div className="space-y-4">
              {/* Product Information */}
              {selectedProduct && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Product Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Print Time per Unit:</span>
                      <span className="font-medium">{selectedProduct.print_time || 0}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Weight per Unit:</span>
                      <span className="font-medium">{selectedProduct.weight || 0}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Printer Type:</span>
                      <Badge variant="outline">{selectedProduct.printer_type || "Any"}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Materials:</span>
                      <div className="flex gap-1">
                        {selectedProduct.required_materials?.map((material: string) => (
                          <Badge key={material} variant="secondary" className="text-xs">
                            {material}
                          </Badge>
                        )) || <span className="text-sm">None specified</span>}
                      </div>
                    </div>
                    
                    {/* Product Availability */}
                    {productAvailability && (
                      <div className="pt-3 border-t">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Availability Status:</span>
                          <Badge 
                            variant={productAvailability.is_available ? "default" : productAvailability.has_production_in_progress ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {productAvailability.is_available ? "Available" : productAvailability.has_production_in_progress ? "In Production" : "Out of Stock"}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Stock: {productAvailability.available_stock} units</div>
                          <div>In Production: {productAvailability.in_production} units</div>
                          <div>Total Available: {productAvailability.total_available} units</div>
                          {productAvailability.earliest_completion && (
                            <div>Earliest Completion: {new Date(productAvailability.earliest_completion).toLocaleDateString()}</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {materialAvailability.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-sm text-muted-foreground">Material Availability:</span>
                        <div className="space-y-1">
                          {materialAvailability.map((item, index) => {
                            const getStatusColor = (status: string) => {
                              switch (status) {
                                case 'Available': return 'bg-green-100 text-green-800'
                                case 'Low': return 'bg-yellow-100 text-yellow-800'
                                case 'Out': return 'bg-red-100 text-red-800'
                                case 'Not Found': return 'bg-gray-100 text-gray-800'
                                default: return 'bg-gray-100 text-gray-800'
                              }
                            }
                            
                            return (
                              <div key={index} className="flex items-center justify-between text-xs">
                                <span>{item.material}</span>
                                <div className="flex items-center gap-2">
                                  <span>{item.available}g/{item.required}g</span>
                                  <Badge className={getStatusColor(item.status)} variant="outline">
                                    {item.status}
                                  </Badge>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Estimated Time:</span>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-bold text-lg">{calculateEstimatedTime().toFixed(1)}h</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Printer Assignment */}
              {selectedProduct && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">Printer Assignment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recommendedPrinter ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="font-medium">Recommended Printer</span>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{recommendedPrinter.printer_name}</span>
                            <Badge className={getPrinterStatusColor(recommendedPrinter.status)}>
                              {recommendedPrinter.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <div>Model: {recommendedPrinter.model}</div>
                            <div>Queue: {recommendedPrinter.job_queue || 0} jobs</div>
                          </div>
                        </div>

                        {/* Alternative Printers */}
                        <div className="space-y-2">
                          <Label>Alternative Printers</Label>
                          <Select
                            value={formData.assigned_printer_id}
                            onValueChange={(value) => handleInputChange("assigned_printer_id", value)}
                            name="assigned_printer_id"
                          >
                            <SelectTrigger id="assigned_printer_id">
                              <SelectValue placeholder="Select alternative printer" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailablePrinters().map((printer) => (
                                <SelectItem key={printer.id} value={printer.id.toString()}>
                                  <div className="flex items-center justify-between w-full">
                                    <span>{printer.printer_name}</span>
                                    <div className="flex items-center gap-2 ml-2">
                                      <Badge className={getPrinterStatusColor(printer.status)} variant="outline">
                                        {printer.status}
                                      </Badge>
                                      <span className="text-xs">Queue: {printer.job_queue || 0}</span>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <AlertTriangle className="h-5 w-5" />
                        <span>No compatible printers available</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Time Calculation */}
              {selectedProduct && formData.quantity && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">Time Calculation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Print time per unit:</span>
                      <span>{selectedProduct.print_time || 0}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Quantity:</span>
                      <span>{formData.quantity} units</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total time:</span>
                      <span>{calculateEstimatedTime().toFixed(1)} hours</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Estimated completion:</span>
                      <span>
                        {new Date(Date.now() + calculateEstimatedTime() * 60 * 60 * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !selectedProduct || !recommendedPrinter || 
                materialAvailability.some(item => 
                  item.status === 'Out' || item.status === 'Not Found' || 
                  (item.status === 'Low' && item.available < item.required)
                )
              }
            >
              {loading ? "Scheduling..." : "Schedule Job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
