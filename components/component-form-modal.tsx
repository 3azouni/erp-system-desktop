"use client"

import * as React from "react"
import { useState } from "react"
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
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

interface ComponentFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  component?: { id: number; [key: string]: any } | null
  onSuccess: () => void
}

const COMPONENT_CATEGORIES = [
  "Nozzle",
  "Build Plate",
  "Belt",
  "Fan",
  "Hotend",
  "Extruder",
  "Motherboard",
  "Display",
  "Power Supply",
  "Stepper Motor",
  "Endstop",
  "Thermistor",
  "Heater Cartridge",
  "PTFE Tube",
  "Other"
]

export function ComponentFormModal({ open, onOpenChange, component, onSuccess }: ComponentFormModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    component_name: "",
    description: "",
    part_number: "",
    category: "",
    cost: "",
    supplier: "",
    minimum_stock_level: "",
    initial_stock: "",
    serial_number_tracking: false,
  })

  // Reset form when modal opens/closes or component changes
  React.useEffect(() => {
    if (open) {
      if (component) {
        // Editing existing component
        setFormData({
          component_name: component.component_name || "",
          description: component.description || "",
          part_number: component.part_number || "",
          category: component.category || "",
          cost: component.cost?.toString() || "",
          supplier: component.supplier || "",
          minimum_stock_level: component.minimum_stock_level?.toString() || "",
          initial_stock: component.current_stock?.toString() || "0",
          serial_number_tracking: component.serial_number_tracking || false,
        })
      } else {
        // Creating new component
        setFormData({
          component_name: "",
          description: "",
          part_number: "",
          category: "",
          cost: "",
          supplier: "",
          minimum_stock_level: "",
          initial_stock: "",
          serial_number_tracking: false,
        })
      }
    }
  }, [open, component])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.component_name || !formData.category || !formData.cost) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const componentData = {
        component_name: formData.component_name,
        description: formData.description || null,
        part_number: formData.part_number || null,
        category: formData.category,
        cost: Number.parseFloat(formData.cost),
        supplier: formData.supplier || null,
        minimum_stock_level: Number.parseInt(formData.minimum_stock_level) || 0,
        initial_stock: Number.parseInt(formData.initial_stock) || 0,
        serial_number_tracking: formData.serial_number_tracking,
      }

      if (component?.id) {
        const response = await fetch(`/api/components/${component.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify(componentData)
        })

        if (!response.ok) {
          throw new Error('Failed to update component')
        }

        toast({
          title: "Success",
          description: "Component updated successfully",
        })
      } else {
        const response = await fetch('/api/components', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify(componentData)
        })

        if (!response.ok) {
          throw new Error('Failed to create component')
        }

        toast({
          title: "Success",
          description: "Component added successfully",
        })
      }

      onSuccess()
      onOpenChange(false)

      // Reset form
      setFormData({
        component_name: "",
        description: "",
        part_number: "",
        category: "",
        cost: "",
        supplier: "",
        minimum_stock_level: "",
        initial_stock: "",
        serial_number_tracking: false,
      })
    } catch (error) {
      console.error("Error saving component:", error)
      toast({
        title: "Error",
        description: "Failed to save component",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{component ? "Edit Component" : "Add New Component"}</DialogTitle>
          <DialogDescription>
            {component ? "Update component details" : "Enter component information to track replacement parts"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="component_name">Component Name *</Label>
            <Input
              id="component_name"
              placeholder="e.g., 0.4mm Nozzle, Build Plate"
              value={formData.component_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, component_name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the component"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="part_number">Part Number</Label>
              <Input
                id="part_number"
                placeholder="e.g., CR-10-001"
                value={formData.part_number}
                onChange={(e) => setFormData((prev) => ({ ...prev, part_number: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                name="category"
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {COMPONENT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Cost ($) *</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.cost}
                onChange={(e) => setFormData((prev) => ({ ...prev, cost: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimum_stock_level">Minimum Stock Level</Label>
              <Input
                id="minimum_stock_level"
                type="number"
                min="0"
                placeholder="0"
                value={formData.minimum_stock_level}
                onChange={(e) => setFormData((prev) => ({ ...prev, minimum_stock_level: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="initial_stock">Initial Stock Quantity</Label>
              <Input
                id="initial_stock"
                type="number"
                min="0"
                placeholder="0"
                value={formData.initial_stock}
                onChange={(e) => setFormData((prev) => ({ ...prev, initial_stock: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier</Label>
            <Input
              id="supplier"
              placeholder="e.g., Creality, Amazon"
              value={formData.supplier}
              onChange={(e) => setFormData((prev) => ({ ...prev, supplier: e.target.value }))}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="serial_number_tracking"
              checked={formData.serial_number_tracking}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, serial_number_tracking: checked }))}
            />
            <Label htmlFor="serial_number_tracking">Track Serial Numbers</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : component ? "Update Component" : "Add Component"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 