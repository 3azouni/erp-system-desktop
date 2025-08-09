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
import { JobSchedulerModal, type PrintJob } from "@/components/job-scheduler-modal"
import { CalendarIcon, Clock, AlertCircle, CheckCircle, Play, Pause, Edit, Trash2, Plus, MoreHorizontal, Eye, Copy, Archive, RotateCcw } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useSettings } from "@/contexts/settings-context"

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
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [editingJob, setEditingJob] = React.useState<PrintJob | null>(null)
  const [selectedStatus, setSelectedStatus] = React.useState("All")

  // Load data
  const loadData = React.useCallback(async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem("auth_token")
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

      const response = await fetch("/api/print-jobs", { headers })
      if (!response.ok) {
        if (response.status === 401) {
          console.log("Authentication required for print jobs")
          setJobs([])
          return
        }
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

  const monitorPrintJobs = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        console.log("No auth token found for monitoring")
        return // Don't show error for background monitoring
      }

      console.log("Calling monitor endpoint...")
      const response = await fetch("/api/print-jobs/monitor", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Monitor response status:", response.status)
      if (response.ok) {
        const data = await response.json()
        console.log("Monitor response data:", data)
        if (data.notifications && data.notifications.length > 0) {
          // Show toast for overdue jobs
          data.notifications.forEach((notification: any) => {
            toast({
              title: "Print Job Overdue",
              description: `${notification.productName} should have finished ${notification.overdueBy} minutes ago. Please check the printer.`,
              variant: "destructive",
            })
          })
        } else {
          console.log("No overdue jobs found")
        }
      } else {
        console.error("Monitor endpoint returned error:", response.status)
        const errorData = await response.json()
        console.error("Error data:", errorData)
      }
    } catch (error) {
      console.error("Error monitoring print jobs:", error)
      // Don't show error toast for background monitoring
    }
  }, [toast])

  React.useEffect(() => {
    loadData()
    
    // Set up periodic monitoring of print jobs
    const monitorInterval = setInterval(() => {
      monitorPrintJobs()
    }, 60000) // Check every minute
    
    return () => clearInterval(monitorInterval)
  }, [loadData, monitorPrintJobs])

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
      .reduce((sum, job) => sum + job.estimated_time_hours, 0)

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
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("Authentication required")
      }

      const updateData: any = { status: newStatus }

      if (newStatus === "Printing") {
        updateData.started_at = new Date().toISOString()
      } else if (newStatus === "Completed") {
        updateData.completed_at = new Date().toISOString()
      }

      // Update job status using local API
      const response = await fetch(`/api/print-jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update job status')
      }

      const responseData = await response.json()

      // Refresh jobs list
      loadData()
      
      toast({
        title: "Success",
        description: `Job status updated to ${newStatus}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update job status",
        variant: "destructive",
      })
    }
  }

  const deleteJob = async (jobId: string) => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("Authentication required")
      }

      // Delete job using local API
      const response = await fetch(`/api/print-jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete job')
      }

      // Refresh jobs list
      loadData()
      
      toast({
        title: "Success",
        description: "Job deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive",
      })
    }
  }

  const viewJobDetails = (job: PrintJob) => {
    setEditingJob(job)
    setIsEditModalOpen(true)
  }

  const duplicateJob = async (job: PrintJob) => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("Authentication required")
      }

      // Create a new job with the same parameters
      const response = await fetch("/api/print-jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: parseInt(job.product_id),
          printer_id: parseInt(job.assigned_printer_id),
          quantity: job.quantity,
          estimated_print_time: job.estimated_time_hours,
          status: "Pending"
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to duplicate job')
      }

      toast({
        title: "Job Duplicated",
        description: `Successfully created duplicate of job ${job.job_id}`,
      })

      // Refresh the jobs list
      loadData()
    } catch (error) {
      console.error("Error duplicating job:", error)
      toast({
        title: "Error",
        description: "Failed to duplicate job",
        variant: "destructive",
      })
    }
  }

  const editJob = (job: PrintJob) => {
    setEditingJob(job)
    setIsEditModalOpen(true)
  }

  const archiveJob = async (jobId: string) => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("Authentication required")
      }

      // Update job status to "Archived" (or you could add an archived field)
      const response = await fetch(`/api/print-jobs/${jobId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "Archived"
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to archive job')
      }

      toast({
        title: "Job Archived",
        description: `Successfully archived job ${jobId}`,
      })

      // Refresh the jobs list
      loadData()
    } catch (error) {
      console.error("Error archiving job:", error)
      toast({
        title: "Error",
        description: "Failed to archive job",
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
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Job
          </Button>
          <Button 
            variant="outline" 
            onClick={monitorPrintJobs}
            disabled={loading}
          >
            <Clock className="mr-2 h-4 w-4" />
            Check Overdue Jobs
          </Button>
        </div>
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
                <TableHead>Availability Impact</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
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
                      <div className="font-mono text-sm">{job.job_id}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{job.product_name}</div>
                        <div className="text-sm text-muted-foreground">{job.product_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{job.assigned_printer_name}</div>
                        <div className="text-sm text-muted-foreground">{job.assigned_printer_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{job.quantity}x</Badge>
                    </TableCell>
                    <TableCell>{formatDuration(job.estimated_time_hours)}</TableCell>
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
                      <div className="text-xs">
                        <div className="font-medium">+{job.quantity} units</div>
                        <div className="text-muted-foreground">
                          {job.status === "Completed" ? "Added to stock" : 
                           job.status === "Printing" ? "In production" : 
                           "Will be available"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{job.notes || "-"}</div>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(job.created_at || new Date().toISOString())}</TableCell>
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
                          
                          {/* View Details */}
                          <DropdownMenuItem onClick={() => viewJobDetails(job)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          
                          {/* Duplicate Job */}
                          <DropdownMenuItem onClick={() => duplicateJob(job)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate Job
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                          
                          {job.status === "Pending" && job.id && (
                            <DropdownMenuItem onClick={() => updateJobStatus(job.id!, "Printing")}>
                              <Play className="mr-2 h-4 w-4" />
                              Start Printing
                            </DropdownMenuItem>
                          )}
                          
                          {job.status === "Printing" && job.id && (
                            <>
                              <DropdownMenuItem onClick={() => updateJobStatus(job.id!, "Completed")}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark Completed
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateJobStatus(job.id!, "Failed")}>
                                <AlertCircle className="mr-2 h-4 w-4" />
                                Mark Failed
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateJobStatus(job.id!, "Pending")}>
                                <Pause className="mr-2 h-4 w-4" />
                                Pause Job
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          {(job.status === "Failed" || job.status === "Completed" || job.status === "Cancelled") && job.id && (
                            <DropdownMenuItem onClick={() => updateJobStatus(job.id!, "Pending")}>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Reset to Pending
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          {/* Archive/Unarchive */}
                          {job.status === "Completed" && job.id && (
                            <DropdownMenuItem onClick={() => archiveJob(job.id!)}>
                              <Archive className="mr-2 h-4 w-4" />
                              Archive Job
                            </DropdownMenuItem>
                          )}
                          
                          {/* Edit Job */}
                          <DropdownMenuItem onClick={() => editJob(job)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Job
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          {/* Delete Job */}
                          {job.id && (
                            <DropdownMenuItem onClick={() => deleteJob(job.id!)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Job
                            </DropdownMenuItem>
                          )}
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
      
      {/* Edit Job Modal */}
      <JobSchedulerModal 
        open={isEditModalOpen} 
        onOpenChange={setIsEditModalOpen} 
        onSuccess={() => {
          loadData()
          setEditingJob(null)
        }}
        editingJob={editingJob}
      />
    </div>
  )
}
