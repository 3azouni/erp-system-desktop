"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { JobSchedulerModal } from "@/components/job-scheduler-modal"
import { CalendarIcon, Clock, AlertCircle, CheckCircle, Play, Pause, Edit, Trash2, Plus, MoreHorizontal } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useSettings } from "@/contexts/settings-context"

interface PrintJob {
  id: string
  job_name: string
  product_id: string
  product_name: string
  printer_id: string
  printer_name: string
  quantity: number
  priority: string
  status: string
  start_time: string
  end_time: string
  estimated_duration: number
  actual_duration: number
  notes: string
  created_at: string
  updated_at: string
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Pending":
      return "bg-blue-100 text-blue-800"
    case "Printing":
      return "bg-yellow-100 text-yellow-800"
    case "Completed":
      return "bg-green-100 text-green-800"
    case "Failed":
      return "bg-red-100 text-red-800"
    case "Cancelled":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Pending":
      return <Clock className="h-4 w-4" />
    case "Printing":
      return <Play className="h-4 w-4" />
    case "Completed":
      return <CheckCircle className="h-4 w-4" />
    case "Failed":
    case "Cancelled":
      return <AlertCircle className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "Urgent":
      return "bg-red-100 text-red-800"
    case "High":
      return "bg-orange-100 text-orange-800"
    case "Normal":
      return "bg-blue-100 text-blue-800"
    case "Low":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function SchedulerPage() {
  const { toast } = useToast()
  const [jobs, setJobs] = React.useState<PrintJob[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [selectedStatus, setSelectedStatus] = React.useState("All")

  // Load data
  const loadData = React.useCallback(async () => {
    try {
      setLoading(true)

      const response = await fetch("/api/print-jobs")
      if (!response.ok) {
        throw new Error("Failed to fetch print jobs")
      }

      const data = await response.json()
      setJobs(data.printJobs || [])
    } catch (error) {
      console.error("Error loading print jobs:", error)
      toast({
        title: "Error",
        description: "Failed to load print jobs",
        variant: "destructive",
      })
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  // Filter jobs by status
  const filteredJobs = React.useMemo(() => {
    if (selectedStatus === "All") return jobs
    return jobs.filter((job) => job.status === selectedStatus)
  }, [jobs, selectedStatus])

  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalJobs = jobs.length
    const pendingJobs = jobs.filter((j) => j.status === "Pending").length
    const printingJobs = jobs.filter((j) => j.status === "Printing").length
    const completedJobs = jobs.filter((j) => j.status === "Completed").length
    const failedJobs = jobs.filter((j) => j.status === "Failed").length
    const cancelledJobs = jobs.filter((j) => j.status === "Cancelled").length

    const totalPrintTime = jobs
      .filter((j) => j.status === "Completed")
      .reduce((sum, job) => sum + job.estimated_duration, 0)

    return {
      totalJobs,
      pendingJobs,
      printingJobs,
      completedJobs,
      failedJobs,
      cancelledJobs,
      totalPrintTime: Math.round(totalPrintTime * 100) / 100,
    }
  }, [jobs])

  const updateJobStatus = async (jobId: string, newStatus: PrintJob["status"]) => {
    try {
      const updateData: any = { status: newStatus }

      if (newStatus === "Printing") {
        updateData.start_time = new Date().toISOString()
      } else if (newStatus === "Completed") {
        updateData.end_time = new Date().toISOString()
      }

      // Update job status using local API
      const response = await fetch(`/api/print-jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        throw new Error('Failed to update job status')
      }

      // Refresh jobs list
      loadData()
    } catch (error) {
      console.error("Error updating job status:", error)
      toast({
        title: "Error",
        description: "Failed to update job status",
        variant: "destructive",
      })
    }
  }

  const deleteJob = async (jobId: string) => {
    try {
      // Delete job using local API
      const response = await fetch(`/api/print-jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete job')
      }

      // Refresh jobs list
      loadData()
    } catch (error) {
      console.error("Error deleting job:", error)
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive",
      })
    }
  }

  const formatDuration = (hours: number) => {
    if (!hours || hours === undefined || hours === null) {
      return "0h"
    }
    if (hours < 1) {
      return `${Math.round(hours * 60)}min`
    }
    return `${hours.toFixed(1)}h`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Production Scheduler</h1>
            <p className="text-muted-foreground">Manage your 3D printing job queue</p>
          </div>
        </div>
        <div className="text-center py-8">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production Scheduler</h1>
          <p className="text-muted-foreground">Manage your 3D printing job queue and production schedule</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Job
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pendingJobs}</div>
            <p className="text-xs text-muted-foreground">Waiting to start</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Printing</CardTitle>
            <Play className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.printingJobs}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedJobs}</div>
            <p className="text-xs text-muted-foreground">Successfully finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failedJobs}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Print Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.totalPrintTime)}</div>
            <p className="text-xs text-muted-foreground">Total completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Printing">Printing</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Print Jobs ({filteredJobs.length})</CardTitle>
          <CardDescription>{selectedStatus !== "All" && `Filtered by: ${selectedStatus}`}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Printer</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Est. Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {selectedStatus !== "All"
                        ? `No ${selectedStatus.toLowerCase()} jobs found`
                        : "No print jobs scheduled. Create your first job to get started."}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="font-mono text-sm">{job.job_name}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{job.product_name}</div>
                        <div className="text-sm text-muted-foreground">{job.product_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{job.printer_name}</div>
                        <div className="text-sm text-muted-foreground">{job.printer_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{job.quantity}x</Badge>
                    </TableCell>
                    <TableCell>{formatDuration(job.estimated_duration)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(job.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(job.status)}
                          {job.status}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(job.priority)} variant="outline">
                        {job.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{job.notes || "-"}</div>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(job.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                          {job.status === "Pending" && (
                            <DropdownMenuItem onClick={() => updateJobStatus(job.id, "Printing")}>
                              <Play className="mr-2 h-4 w-4" />
                              Start Printing
                            </DropdownMenuItem>
                          )}
                          {job.status === "Printing" && (
                            <>
                              <DropdownMenuItem onClick={() => updateJobStatus(job.id, "Completed")}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark Completed
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateJobStatus(job.id, "Failed")}>
                                <AlertCircle className="mr-2 h-4 w-4" />
                                Mark Failed
                              </DropdownMenuItem>
                            </>
                          )}
                          {(job.status === "Failed" || job.status === "Completed" || job.status === "Cancelled") && (
                            <DropdownMenuItem onClick={() => updateJobStatus(job.id, "Pending")}>
                              <Clock className="mr-2 h-4 w-4" />
                              Reset to Pending
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => deleteJob(job.id)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Job
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Job Scheduler Modal */}
      <JobSchedulerModal open={isModalOpen} onOpenChange={setIsModalOpen} onSuccess={loadData} />
    </div>
  )
}
