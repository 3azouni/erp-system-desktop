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
  const [formData, setFormData] = React.useState({
    product_name: "",
    sku: "",
    category: "",
    description: "",
    print_time: "",
    weight: "",
    printer_type: "",
    image_url: "",
  })
  const [materials, setMaterials] = React.useState<string[]>([])
  const [newMaterial, setNewMaterial] = React.useState("")

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
        })
        setMaterials([])
      }
      setNewMaterial("")
    }
  }, [open, product])

  const generateSKU = () => {
    const timestamp = Date.now().toString().slice(-6)
    return `3DP-${timestamp}`
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

      const productData = {
        product_name: formData.product_name.trim(),
        sku: formData.sku.trim() || generateSKU(),
        category: formData.category,
        description: formData.description.trim() || null,
        required_materials: materials,
        print_time: printTime,
        weight: weight,
        printer_type: formData.printer_type,
        image_url: formData.image_url.trim() || null,
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
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleInputChange("sku", e.target.value)}
                placeholder="Auto-generated if empty"
              />
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
