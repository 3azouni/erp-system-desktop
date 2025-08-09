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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProductFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: { id: string; [key: string]: any } | null
  onSuccess: () => void
}

const CATEGORIES = [
  "Miniatures",
  "Functional Parts",
  "Prototypes",
  "Decorative Items",
  "Tools & Accessories",
  "Educational Models",
  "Custom Parts",
]

const PRINTER_TYPES = ["FDM", "SLA", "SLS", "Multi-Material", "Large Format", "High Detail", "Any"]

const COMMON_MATERIALS = [
  "PLA",
  "ABS",
  "PETG",
  "TPU",
  "PLA+",
  "ASA",
  "PC",
  "Nylon",
  "Wood Fill",
  "Metal Fill",
  "Carbon Fiber",
  "Resin",
]

export function ProductFormModal({ open, onOpenChange, product, onSuccess }: ProductFormModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [userRole, setUserRole] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState({
    product_name: "",
    sku: "",
    category: "",
    description: "",
    print_time: "",
    weight: "",
    printer_type: "",
    image_url: "",
    barcode_type: "",
    barcode_value: "",
    barcode_image_url: "",
  })
  const [materials, setMaterials] = React.useState<string[]>([])
  const [newMaterial, setNewMaterial] = React.useState("")

  // Get user role on component mount
  React.useEffect(() => {
    const getUserRole = async () => {
      try {
        const token = localStorage.getItem('supabase.auth.token')
        if (token) {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          if (response.ok) {
            const userData = await response.json()
            setUserRole(userData.role)
          }
        }
      } catch (error) {
        console.error('Error getting user role:', error)
      }
    }
    
    getUserRole()
  }, [])

  // Reset form when modal opens/closes or product changes
  React.useEffect(() => {
    if (open) {
      if (product) {
        // Editing existing product
        setFormData({
          product_name: product.product_name || "",
          sku: product.sku || "",
          category: product.category || "",
          description: product.description || "",
          print_time: product.print_time?.toString() || "",
          weight: product.weight?.toString() || "",
          printer_type: product.printer_type || "",
          image_url: product.image_url || "",
          barcode_type: product.barcode_type || "",
          barcode_value: product.barcode_value || "",
          barcode_image_url: product.barcode_image_url || "",
        })
        setMaterials(Array.isArray(product.required_materials) ? product.required_materials : [])
      } else {
        // Creating new product
        setFormData({
          product_name: "",
          sku: generateSKU(),
          category: "",
          description: "",
          print_time: "",
          weight: "",
          printer_type: "",
          image_url: "",
          barcode_type: "",
          barcode_value: "",
          barcode_image_url: "",
        })
        setMaterials([])
      }
      setNewMaterial("")
    }
  }, [open, product])

  const generateSKU = async () => {
    // Only generate if we have product name and category
    if (!formData.product_name.trim() || !formData.category) {
      toast({
        title: "Cannot generate SKU",
        description: "Please enter product name and select category first.",
        variant: "destructive",
      })
      return
    }

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('supabase.auth.token')
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please log in to generate SKU.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/products/generate-sku", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          productName: formData.product_name.trim(),
          category: formData.category,
          materials: materials,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate SKU")
      }

      const { sku } = await response.json()
      handleInputChange("sku", sku)

      toast({
        title: "SKU Generated",
        description: `Generated SKU: ${sku}`,
      })
    } catch (error) {
      console.error("Error generating SKU:", error)
      toast({
        title: "Error generating SKU",
        description: "Failed to generate SKU. Please try again.",
        variant: "destructive",
      })
    }
  }

  const generateBarcode = async () => {
    // Check if we have required fields
    if (!formData.barcode_type) {
      toast({
        title: "Cannot generate barcode",
        description: "Please select a barcode type first.",
        variant: "destructive",
      })
      return
    }

    if (!formData.sku.trim() && !formData.barcode_value.trim()) {
      toast({
        title: "Cannot generate barcode",
        description: "Please provide either SKU or barcode value.",
        variant: "destructive",
      })
      return
    }

    // For new products, we need to save first to get an ID
    if (!product?.id) {
      toast({
        title: "Cannot generate barcode",
        description: "Please save the product first, then generate barcode.",
        variant: "destructive",
      })
      return
    }

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('supabase.auth.token')
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please log in to generate barcode.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/products/generate-barcode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          barcodeType: formData.barcode_type,
          barcodeValue: formData.barcode_value.trim() || null,
          sku: formData.sku.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate barcode")
      }

      const { barcodeImageUrl, barcodeValue } = await response.json()
      
      // Update form with generated barcode info
      handleInputChange("barcode_value", barcodeValue)
      handleInputChange("barcode_image_url", barcodeImageUrl)

      toast({
        title: "Barcode Generated",
        description: "Barcode image has been generated and uploaded.",
      })
    } catch (error) {
      console.error("Error generating barcode:", error)
      toast({
        title: "Error generating barcode",
        description: error instanceof Error ? error.message : "Failed to generate barcode. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const addMaterial = (material: string) => {
    const trimmedMaterial = material.trim()
    if (trimmedMaterial && !materials.includes(trimmedMaterial)) {
      setMaterials((prev) => [...prev, trimmedMaterial])
      setNewMaterial("")
    }
  }

  const removeMaterial = (material: string) => {
    setMaterials((prev) => prev.filter((m) => m !== material))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.product_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name is required.",
        variant: "destructive",
      })
      return
    }

    if (!formData.category) {
      toast({
        title: "Validation Error",
        description: "Please select a category.",
        variant: "destructive",
      })
      return
    }

    if (!formData.printer_type) {
      toast({
        title: "Validation Error",
        description: "Please select a printer type.",
        variant: "destructive",
      })
      return
    }

    const printTime = Number.parseFloat(formData.print_time)
    const weight = Number.parseInt(formData.weight)

    if (isNaN(printTime) || printTime < 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid print time.",
        variant: "destructive",
      })
      return
    }

    if (isNaN(weight) || weight < 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid weight.",
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
          description: "Authentication required for saving products.",
          variant: "destructive",
        })
        return
      }

      // Generate SKU if empty
      let finalSku = formData.sku.trim()
      if (!finalSku) {
        try {
          // Get auth token from localStorage
          const token = localStorage.getItem('supabase.auth.token')
          if (!token) {
            // Fallback to old method if no auth token
            const timestamp = Date.now().toString().slice(-6)
            finalSku = `3DP-${timestamp}`
          } else {
            const response = await fetch("/api/products/generate-sku", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
              },
              body: JSON.stringify({
                productName: formData.product_name.trim(),
                category: formData.category,
                materials: materials,
              }),
            })

            if (response.ok) {
              const { sku } = await response.json()
              finalSku = sku
            } else {
              // Fallback to old method if SKU generation fails
              const timestamp = Date.now().toString().slice(-6)
              finalSku = `3DP-${timestamp}`
            }
          }
        } catch (error) {
          // Fallback to old method if SKU generation fails
          const timestamp = Date.now().toString().slice(-6)
          finalSku = `3DP-${timestamp}`
        }
      }

      const productData = {
        product_name: formData.product_name.trim(),
        sku: finalSku,
        category: formData.category,
        description: formData.description.trim() || null,
        required_materials: materials,
        print_time: printTime,
        weight: weight,
        printer_type: formData.printer_type,
        image_url: formData.image_url.trim() || null,
        barcode_type: formData.barcode_type || null,
        barcode_value: formData.barcode_value.trim() || null,
        barcode_image_url: formData.barcode_image_url.trim() || null,
      }
      
      console.log('Sending product data to API:', productData)
      console.log('Materials array:', materials, 'Type:', typeof materials, 'IsArray:', Array.isArray(materials))

      let response
      if (product) {
        // Update existing product
        response = await fetch(`/api/products/${product.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(productData),
        })
      } else {
        // Create new product
        response = await fetch("/api/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(productData),
        })
      }

      if (!response.ok) {
        throw new Error("Failed to save product")
      }

      const result = await response.json()

      toast({
        title: product ? "Product updated" : "Product created",
        description: `${productData.product_name} has been ${product ? "updated" : "created"} successfully.`,
      })
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving product:", error)
      toast({
        title: "Error saving product",
        description: "Failed to save the product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
          <DialogDescription>
            {product ? "Update the product information below." : "Fill in the details to create a new product."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_name">Product Name *</Label>
              <Input
                id="product_name"
                value={formData.product_name}
                onChange={(e) => handleInputChange("product_name", e.target.value)}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <div className="flex gap-2">
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleInputChange("sku", e.target.value)}
                  placeholder="Auto-generated if empty"
                  className="flex-1"
                />
                {userRole && ['admin', 'production'].includes(userRole) ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateSKU}
                    disabled={!formData.product_name.trim() || !formData.category}
                    className="whitespace-nowrap"
                  >
                    Generate SKU
                  </Button>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    SKU generation requires admin or production role
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)} name="category">
                <SelectTrigger id="category">
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

            <div className="space-y-2">
              <Label htmlFor="printer_type">Printer Type *</Label>
              <Select value={formData.printer_type} onValueChange={(value) => handleInputChange("printer_type", value)} name="printer_type">
                <SelectTrigger id="printer_type">
                  <SelectValue placeholder="Select printer type" />
                </SelectTrigger>
                <SelectContent>
                  {PRINTER_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter product description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="print_time">Print Time (hours) *</Label>
              <Input
                id="print_time"
                type="number"
                step="0.1"
                min="0"
                value={formData.print_time}
                onChange={(e) => handleInputChange("print_time", e.target.value)}
                placeholder="0.0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (grams) *</Label>
              <Input
                id="weight"
                type="number"
                min="0"
                value={formData.weight}
                onChange={(e) => handleInputChange("weight", e.target.value)}
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => handleInputChange("image_url", e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

                     {/* Barcode Section */}
           <div className="space-y-4">
             <div className="flex items-center gap-2">
               <Label className="text-base font-medium">Barcode Information</Label>
               <Badge variant="outline" className="text-xs">Optional</Badge>
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="barcode_type">Barcode Type</Label>
                 <Select value={formData.barcode_type} onValueChange={(value) => handleInputChange("barcode_type", value)} name="barcode_type">
                   <SelectTrigger id="barcode_type">
                     <SelectValue placeholder="Select barcode type" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="EAN13">EAN-13</SelectItem>
                     <SelectItem value="CODE128">Code 128</SelectItem>
                     <SelectItem value="QR">QR Code</SelectItem>
                   </SelectContent>
                 </Select>
               </div>

               <div className="space-y-2">
                 <Label htmlFor="barcode_value">Barcode Value</Label>
                 <Input
                   id="barcode_value"
                   value={formData.barcode_value}
                   onChange={(e) => handleInputChange("barcode_value", e.target.value)}
                   placeholder="Enter barcode value"
                 />
               </div>
             </div>

             <div className="flex gap-2">
               {userRole && ['admin', 'production'].includes(userRole) ? (
                 <Button
                   type="button"
                   variant="outline"
                   onClick={generateBarcode}
                   disabled={!formData.barcode_type || (!formData.sku.trim() && !formData.barcode_value.trim()) || !product?.id}
                   className="whitespace-nowrap"
                 >
                   Generate Barcode
                 </Button>
               ) : (
                 <div className="text-sm text-muted-foreground">
                   Barcode generation requires admin or production role
                 </div>
               )}
               {formData.barcode_image_url && (
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                   <span>•</span>
                   <span>Barcode generated</span>
                 </div>
               )}
             </div>

             {formData.barcode_image_url && (
               <div className="space-y-2">
                 <Label>Barcode Preview</Label>
                 <div className="border rounded-lg p-4 bg-muted/50">
                   <img
                     src={formData.barcode_image_url}
                     alt={`Barcode for ${formData.product_name}`}
                     className="max-w-full h-auto max-h-32 object-contain"
                   />
                 </div>
               </div>
             )}

             <div className="space-y-2">
               <Label htmlFor="barcode_image_url">Barcode Image URL</Label>
               <Input
                 id="barcode_image_url"
                 type="url"
                 value={formData.barcode_image_url}
                 onChange={(e) => handleInputChange("barcode_image_url", e.target.value)}
                 placeholder="https://example.com/barcode.png"
               />
             </div>
           </div>

          <div className="space-y-2">
            <Label htmlFor="material-select">Required Materials</Label>
            <div className="flex gap-2">
              <Select value={newMaterial} onValueChange={setNewMaterial} name="material-select">
                <SelectTrigger id="material-select" className="flex-1">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_MATERIALS.map((material) => (
                    <SelectItem key={material} value={material}>
                      {material}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                name="add-material-button"
                onClick={() => addMaterial(newMaterial)}
                disabled={!newMaterial}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Label htmlFor="custom-material" className="sr-only">Custom Material</Label>
              <Input
                id="custom-material"
                name="custom-material"
                value={newMaterial}
                onChange={(e) => setNewMaterial(e.target.value)}
                placeholder="Or type custom material"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addMaterial(newMaterial)
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                name="add-custom-material-button"
                onClick={() => addMaterial(newMaterial)}
                disabled={!newMaterial.trim()}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {materials.map((material) => (
                <Badge key={material} variant="secondary" className="flex items-center gap-1">
                  {material}
                  <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeMaterial(material)} />
                </Badge>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" name="cancel-button" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" name="submit-button" disabled={loading}>
              {loading ? "Saving..." : product ? "Update Product" : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
