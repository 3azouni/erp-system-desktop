"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Activity, Clock, Zap, AlertTriangle } from "lucide-react"
import { PrinterFormModal } from "@/components/printer-form-modal"
import { useToast } from "@/hooks/use-toast"

const STATUS_OPTIONS = ["All Status", "Idle", "Printing", "Maintenance", "Offline"]

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    Idle: "bg-green-100 text-green-800",
    Printing: "bg-blue-100 text-blue-800",
    Maintenance: "bg-yellow-100 text-yellow-800",
    Offline: "bg-red-100 text-red-800",
  }
  return colors[status] || "bg-gray-100 text-gray-800"
}

export function PrintersPage() {
  const { toast } = useToast()
  const [printers, setPrinters] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("All Status")
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingPrinter, setEditingPrinter] = React.useState<any | null>(null)

  // Load printers from API
  const loadPrinters = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/printers')
      if (response.ok) {
        const data = await response.json()
        setPrinters(data.printers || [])
      } else {
        console.error('Failed to load printers')
        toast({
          title: "Error",
          description: "Failed to load printers",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading printers:', error)
      toast({
        title: "Error",
        description: "Failed to load printers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Load printers on component mount
  React.useEffect(() => {
    loadPrinters()
  }, [loadPrinters])

  // Check for maintenance notifications when printers load
  React.useEffect(() => {
    if (printers.length > 0) {
      checkMaintenanceNotifications()
    }
  }, [printers])

  const checkMaintenanceNotifications = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      const response = await fetch('/api/maintenance/notifications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.notifications && data.notifications.length > 0) {
          console.log(`Created ${data.notifications.length} maintenance notifications`)
        }
      }
    } catch (error) {
      console.error('Error checking maintenance notifications:', error)
    }
  }

  const filteredPrinters = React.useMemo(() => {
    return printers.filter((printer) => {
      const matchesSearch =
        (printer.printer_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (printer.model || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (printer.location || "").toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "All Status" || printer.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [printers, searchTerm, statusFilter])

  const stats = React.useMemo(() => {
    const totalPrinters = printers.length
    const activePrinters = printers.filter((p) => p.status === "Printing").length
    const idlePrinters = printers.filter((p) => p.status === "Idle").length
    const maintenancePrinters = printers.filter((p) => p.status === "Maintenance").length
    const totalHours = printers.reduce((sum, p) => sum + (p.hours_printed || 0), 0)
    const totalPowerConsumption = printers.reduce((sum, p) => sum + (p.power_consumption || 0), 0)

    // Check for maintenance needs
    const maintenanceNeeded = printers.filter((p) => {
      const lastMaintenance = new Date(p.last_maintenance_date || new Date())
      const today = new Date()
      const daysSinceMaintenance = Math.floor((today.getTime() - lastMaintenance.getTime()) / (1000 * 60 * 60 * 24))
      const hoursPrinted = p.hours_printed || 0
      
      return daysSinceMaintenance >= 30 || hoursPrinted >= 500
    }).length

    return {
      totalPrinters,
      activePrinters,
      idlePrinters,
      maintenancePrinters,
      maintenanceNeeded,
      totalHours: Math.round(totalHours * 100) / 100,
      totalPowerConsumption,
    }
  }, [printers])

  const handleEdit = (printer: any) => {
    setEditingPrinter(printer)
    setIsModalOpen(true)
  }

  const handleDelete = async (printer: any) => {
    if (!printer?.id) {
      toast({
        title: "Error",
        description: "Invalid printer ID",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/printers/${printer.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete printer')
      }

      toast({
        title: "Success",
        description: "Printer deleted successfully",
      })

      loadPrinters()
    } catch (error) {
      console.error("Error deleting printer:", error)
      toast({
        title: "Error",
        description: "Failed to delete printer",
        variant: "destructive",
      })
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingPrinter(null)
  }

  const handleModalSuccess = () => {
    loadPrinters()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Printers</h1>
            <p className="text-muted-foreground">Manage your 3D printer fleet</p>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Printers</h1>
          <p className="text-muted-foreground">Manage your 3D printer fleet</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Printer
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Printers</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPrinters}</div>
            <p className="text-xs text-muted-foreground">{stats.activePrinters} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Printers</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.activePrinters}</div>
            <p className="text-xs text-muted-foreground">{stats.idlePrinters} idle</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours}h</div>
            <p className="text-xs text-muted-foreground">
              Avg: {stats.totalPrinters > 0 ? (stats.totalHours / stats.totalPrinters).toFixed(1) : 0}h per printer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Power Usage</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPowerConsumption}W</div>
            <p className="text-xs text-muted-foreground">{stats.maintenancePrinters} in maintenance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.maintenanceNeeded}</div>
            <p className="text-xs text-muted-foreground">printers need maintenance</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search printers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Printer Fleet ({filteredPrinters.length})</CardTitle>
          <CardDescription>
            {statusFilter !== "All Status" && `Filtered by: ${statusFilter}`}
            {searchTerm && ` • Search: "${searchTerm}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Printer</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Hours Printed</TableHead>
                <TableHead>Power (W)</TableHead>
                <TableHead>Job Queue</TableHead>
                <TableHead>Last Maintenance</TableHead>
                <TableHead>Maintenance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrinters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchTerm || statusFilter !== "All Status"
                        ? "No printers match your filters"
                        : "No printers found. Add your first printer to get started."}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPrinters.map((printer) => {
                  // Calculate maintenance status
                  const lastMaintenance = new Date(printer.last_maintenance_date || new Date())
                  const today = new Date()
                  const daysSinceMaintenance = Math.floor((today.getTime() - lastMaintenance.getTime()) / (1000 * 60 * 60 * 24))
                  const hoursPrinted = printer.hours_printed || 0
                  
                  const needsMaintenance = daysSinceMaintenance >= 30 || hoursPrinted >= 500
                  const isOverdue = daysSinceMaintenance >= 45 || hoursPrinted >= 600
                  
                  return (
                    <TableRow key={printer.id}>
                      <TableCell className="font-medium">{printer.printer_name}</TableCell>
                      <TableCell>{printer.model}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(printer.status)}>{printer.status}</Badge>
                      </TableCell>
                      <TableCell>{printer.location || "Not specified"}</TableCell>
                      <TableCell>{printer.hours_printed || 0}h</TableCell>
                      <TableCell>{printer.power_consumption || 0}W</TableCell>
                      <TableCell>{printer.job_queue || 0}</TableCell>
                      <TableCell>
                        {printer.last_maintenance_date
                          ? new Date(printer.last_maintenance_date).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        {needsMaintenance ? (
                          <Badge variant={isOverdue ? "destructive" : "secondary"} className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {isOverdue ? "Overdue" : "Due"}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600">OK</Badge>
                        )}
                      </TableCell>
                                            <TableCell className="text-right">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(printer)}
                            className="h-8 px-2"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(printer)}
                            className="h-8 px-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PrinterFormModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        printer={editingPrinter}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}
