"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Save, Settings, DollarSign, Palette, Printer, Download, Database } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useSettings } from "@/contexts/settings-context"
import { useToast } from "@/hooks/use-toast"



export interface PrinterProfile {
  id: string
  name: string
  type: string
  build_volume: {
    x: number
    y: number
    z: number
  }
  materials: string[]
  nozzle_sizes: number[]
  default_settings: {
    layer_height: number
    infill_density: number
    print_speed: number
    temperature: number
  }
}

export function SettingsPage() {
  const { settings, loading, updateSettings } = useSettings()
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<PrinterProfile | null>(null)
  const [profileFormData, setProfileFormData] = useState({
    name: "",
    type: "FDM",
    build_volume_x: "200",
    build_volume_y: "200",
    build_volume_z: "200",
    materials: "",
    nozzle_sizes: "",
    layer_height: "0.2",
    infill_density: "20",
    print_speed: "50",
    temperature: "200",
  })
  const [formData, setFormData] = useState({
    electricity_cost_per_kwh: 0.12,
    labor_rate_per_hour: 25.0,
    default_marketing_percentage: 10.0,
    platform_fee_percentage: 3.0,
    misc_buffer_percentage: 5.0,
    currency: "USD",
    usd_to_lbp_rate: 89.5,
    app_name: "3DP Commander",
    app_logo_url: "",
    footer_text: "Powered by 3DP Commander - 3D Printing Business Management",
    printer_profiles: [] as PrinterProfile[],
  })
  const [saving, setSaving] = useState(false)
  const [actualPrinters, setActualPrinters] = useState<any[]>([])

  useEffect(() => {
    if (settings && !loading) {
      setFormData({
        electricity_cost_per_kwh: settings.electricity_cost_per_kwh || 0.12,
        labor_rate_per_hour: settings.labor_rate_per_hour || 25.0,
        default_marketing_percentage: settings.default_marketing_percentage || 10.0,
        platform_fee_percentage: settings.platform_fee_percentage || 3.0,
        misc_buffer_percentage: settings.misc_buffer_percentage || 5.0,
        currency: settings.currency || "USD",
        usd_to_lbp_rate: settings.usd_to_lbp_rate || 89.5,
        app_name: settings.app_name || "3DP Commander",
        app_logo_url: settings.app_logo_url || "",
        footer_text: settings.footer_text || "Powered by 3DP Commander - 3D Printing Business Management",
        printer_profiles: settings.printer_profiles || [],
      })
    }
  }, [settings, loading])

  // Load actual printers from database
  useEffect(() => {
    const loadActualPrinters = async () => {
      try {
        const response = await fetch('/api/printers')
        if (response.ok) {
          const data = await response.json()
          setActualPrinters(data.printers || [])
        }
      } catch (error) {
        console.error('Error loading actual printers:', error)
      }
    }
    loadActualPrinters()
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      await updateSettings(formData)
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddProfile = () => {
    const newProfile: PrinterProfile = {
      id: `printer-${Date.now()}`,
      name: "New Printer",
      type: "FDM", // Default type
      build_volume: { x: 200, y: 200, z: 200 }, // Default build volume
      materials: ["PLA"], // Default materials
      nozzle_sizes: [0.4], // Default nozzle size
      default_settings: {
        layer_height: 0.2,
        infill_density: 20,
        print_speed: 50,
        temperature: 200,
      },
    }
    setProfileFormData({
      name: newProfile.name,
      type: newProfile.type,
      build_volume_x: newProfile.build_volume.x.toString(),
      build_volume_y: newProfile.build_volume.y.toString(),
      build_volume_z: newProfile.build_volume.z.toString(),
      materials: newProfile.materials.join(", "),
      nozzle_sizes: newProfile.nozzle_sizes.join(", "),
      layer_height: newProfile.default_settings.layer_height.toString(),
      infill_density: newProfile.default_settings.infill_density.toString(),
      print_speed: newProfile.default_settings.print_speed.toString(),
      temperature: newProfile.default_settings.temperature.toString(),
    })
    setEditingProfile(null)
    setIsModalOpen(true)
  }

  const handleEditProfile = (profile: PrinterProfile) => {
    setEditingProfile(profile)
    setProfileFormData({
      name: profile.name,
      type: profile.type,
      build_volume_x: profile.build_volume.x.toString(),
      build_volume_y: profile.build_volume.y.toString(),
      build_volume_z: profile.build_volume.z.toString(),
      materials: profile.materials.join(", "),
      nozzle_sizes: profile.nozzle_sizes.join(", "),
      layer_height: profile.default_settings.layer_height.toString(),
      infill_density: profile.default_settings.infill_density.toString(),
      print_speed: profile.default_settings.print_speed.toString(),
      temperature: profile.default_settings.temperature.toString(),
    })
    setIsModalOpen(true)
  }

  const handleSaveProfile = async () => {
    if (!settings) return

    try {
      const materials = profileFormData.materials.split(",").map((m: string) => m.trim()).filter((m: string) => m)
      const nozzleSizes = profileFormData.nozzle_sizes.split(",").map((n: string) => parseFloat(n.trim())).filter((n: number) => !isNaN(n))

      const profile: PrinterProfile = {
        id: editingProfile?.id || `printer-${Date.now()}`,
        name: profileFormData.name,
        type: profileFormData.type,
        build_volume: {
          x: parseInt(profileFormData.build_volume_x),
          y: parseInt(profileFormData.build_volume_y),
          z: parseInt(profileFormData.build_volume_z),
        },
        materials,
        nozzle_sizes: nozzleSizes,
        default_settings: {
          layer_height: parseFloat(profileFormData.layer_height),
          infill_density: parseInt(profileFormData.infill_density),
          print_speed: parseInt(profileFormData.print_speed),
          temperature: parseInt(profileFormData.temperature),
        },
      }

      const updatedProfiles = editingProfile
        ? settings.printer_profiles.map(p => p.id === editingProfile.id ? profile : p)
        : [...settings.printer_profiles, profile]

      await updateSettings({
        ...settings,
        printer_profiles: updatedProfiles,
      })

      toast({
        title: "Success",
        description: `Printer profile ${editingProfile ? 'updated' : 'added'} successfully`,
      })

      setIsModalOpen(false)
      setEditingProfile(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save printer profile",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProfile = async (profileId: string) => {
    if (!settings) return

    if (!confirm("Are you sure you want to delete this printer profile?")) return

    try {
      const updatedProfiles = settings.printer_profiles.filter(p => p.id !== profileId)
      await updateSettings({
        ...settings,
        printer_profiles: updatedProfiles,
      })

      toast({
        title: "Success",
        description: "Printer profile deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete printer profile",
        variant: "destructive",
      })
    }
  }

  const handleExportSettings = () => {
    if (!settings) return

    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = '3dp-commander-settings.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Success",
      description: "Settings exported successfully",
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure your application preferences</p>
        </div>
        <div className="animate-pulse">
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure your application preferences</p>
        </div>
        <div className="animate-pulse">
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure your application preferences</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportSettings} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="cost-defaults" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cost-defaults" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Cost Defaults
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            App Branding
          </TabsTrigger>
          <TabsTrigger value="printers" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Printer Profiles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cost-defaults" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cost Calculation Defaults</CardTitle>
              <CardDescription>
                Set default values used in product cost calculations across the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="electricity-cost">Electricity Cost per kWh</Label>
                  <Input
                    id="electricity-cost"
                    type="number"
                    step="0.01"
                    value={formData.electricity_cost_per_kwh.toString()}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        electricity_cost_per_kwh: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="labor-rate">Labor Rate per Hour</Label>
                  <Input
                    id="labor-rate"
                    type="number"
                    step="0.01"
                    value={formData.labor_rate_per_hour.toString()}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        labor_rate_per_hour: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marketing-percentage">Default Marketing %</Label>
                  <Input
                    id="marketing-percentage"
                    type="number"
                    step="0.1"
                    value={formData.default_marketing_percentage.toString()}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        default_marketing_percentage: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform-fee">Platform Fee %</Label>
                  <Input
                    id="platform-fee"
                    type="number"
                    step="0.1"
                    value={formData.platform_fee_percentage.toString()}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        platform_fee_percentage: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="misc-buffer">Misc Buffer %</Label>
                  <Input
                    id="misc-buffer"
                    type="number"
                    step="0.1"
                    value={formData.misc_buffer_percentage.toString()}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        misc_buffer_percentage: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        currency: value,
                      })
                    }
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="LBP">LBP - Lebanese Pound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.currency === "LBP" && (
                  <div className="space-y-2">
                    <Label htmlFor="exchange-rate">USD to LBP Exchange Rate</Label>
                    <Input
                      id="exchange-rate"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.usd_to_lbp_rate?.toString() || "89.5"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          usd_to_lbp_rate: Number.parseFloat(e.target.value) || 89.5,
                        })
                      }
                      placeholder="89.5"
                    />
                    <p className="text-xs text-muted-foreground">
                      Current rate: 1 USD = {formData.usd_to_lbp_rate || 89.5} LBP
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Management</CardTitle>
              <CardDescription>Manage your application database and import existing data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Current Database Location</h4>
                    <p className="text-sm text-muted-foreground">
                      {typeof window !== 'undefined' && (window as any).electronAPI 
                        ? "Using Electron app data directory"
                        : "Using Documents folder"
                      }
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (typeof window !== 'undefined' && (window as any).electronAPI) {
                        const dbPath = await (window as any).electronAPI.getDatabasePath()
                        toast({
                          title: "Database Location",
                          description: `Current database: ${dbPath}`,
                        })
                      }
                    }}
                  >
                    View Path
                  </Button>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Import Existing Database</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select an existing database file to import. This will replace your current database.
                  </p>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (typeof window !== 'undefined' && (window as any).electronAPI) {
                        try {
                          const selectedPath = await (window as any).electronAPI.selectDatabaseFile()
                          if (selectedPath) {
                            const currentDbPath = await (window as any).electronAPI.getDatabasePath()
                            const result = await (window as any).electronAPI.copyDatabaseFile(selectedPath, currentDbPath)
                            
                            if (result.success) {
                              toast({
                                title: "Database Imported",
                                description: "Database has been successfully imported. Please restart the application.",
                              })
                            } else {
                              toast({
                                title: "Import Failed",
                                description: `Failed to import database: ${result.error}`,
                                variant: "destructive",
                              })
                            }
                          }
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to import database",
                            variant: "destructive",
                          })
                        }
                      } else {
                        toast({
                          title: "Not Available",
                          description: "Database import is only available in the desktop application.",
                        })
                      }
                    }}
                  >
                    Select Database File
                  </Button>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Database Information</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Database files are stored in the application's user data directory</p>
                    <p>• You can import existing databases from other installations</p>
                    <p>• Database files use SQLite format (.db extension)</p>
                    <p>• Always backup your database before importing</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Branding</CardTitle>
              <CardDescription>Customize the appearance and branding of your application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="app-name">Application Name</Label>
                  <Input
                    id="app-name"
                    value={formData.app_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        app_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="app-logo">Logo URL</Label>
                  <Input
                    id="app-logo"
                    value={formData.app_logo_url}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        app_logo_url: e.target.value,
                      })
                    }
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="footer-text">Footer Text</Label>
                <Textarea
                  id="footer-text"
                  value={formData.footer_text}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      footer_text: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Preview</h3>
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="flex items-center gap-3 mb-4">
                    {formData.app_logo_url ? (
                      <img src={formData.app_logo_url || "/placeholder.svg"} alt="Logo" className="h-8 w-8 rounded" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                        <Settings className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold">{formData.app_name}</h4>
                      <p className="text-xs text-muted-foreground">Business Management</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground border-t pt-2">{formData.footer_text}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="printers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Printer Profiles</CardTitle>
              <CardDescription>
                Configure default printer profiles for cost calculations and job scheduling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Configured Printers</h3>
                <Button onClick={handleAddProfile} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Printer
                </Button>
              </div>
              <div className="space-y-4">
                {settings.printer_profiles.map((profile) => (
                  <div key={profile.id} className="border rounded-lg p-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Printer Name</Label>
                        <Input
                          id={`printer-name-${profile.id}`}
                          name={`printer-name-${profile.id}`}
                          value={profile.name || ""}
                          onChange={(e) => updatePrinterProfile(profile.id, { name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Power Draw (Watts)</Label>
                        <Input
                          id={`power-draw-${profile.id}`}
                          name={`power-draw-${profile.id}`}
                          type="number"
                          value={profile.power_draw_watts?.toString() || "200"}
                          onChange={(e) =>
                            updatePrinterProfile(profile.id, {
                              power_draw_watts: Number.parseInt(e.target.value) || 200,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Default Speed (mm/s)</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`print-speed-${profile.id}`}
                            name={`print-speed-${profile.id}`}
                            type="number"
                            value={profile.default_print_speed?.toString() || "50"}
                            onChange={(e) =>
                              updatePrinterProfile(profile.id, {
                                default_print_speed: Number.parseInt(e.target.value) || 50,
                              })
                            }
                          />
                          <Button variant="outline" size="icon" onClick={() => handleDeleteProfile(profile.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {settings.printer_profiles.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Printer className="mx-auto h-8 w-8 mb-2" />
                    <p>No printer profiles configured</p>
                    <p className="text-sm">Add a printer profile to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actual Printers in Database</CardTitle>
              <CardDescription>
                These are the actual printers registered in your system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {actualPrinters.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Printer className="mx-auto h-8 w-8 mb-2" />
                    <p>No actual printers found</p>
                    <p className="text-sm">Add printers from the Printers page</p>
                  </div>
                ) : (
                  actualPrinters.map((printer) => (
                    <div key={printer.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{printer.printer_name}</h4>
                          <p className="text-sm text-muted-foreground">{printer.model}</p>
                          <p className="text-xs text-muted-foreground">
                            Status: {printer.status} • Power: {printer.power_consumption}W • Hours: {printer.hours_printed}h
                          </p>
                        </div>
                        <Badge variant={printer.status === 'Idle' ? 'default' : printer.status === 'Printing' ? 'secondary' : 'destructive'}>
                          {printer.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
