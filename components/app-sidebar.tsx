"use client"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  BarChart3,
  Box,
  Calculator,
  Home,
  Package,
  Printer,
  Settings,
  ShoppingCart,
  Calendar,
  Receipt,
  User,
  Wrench,
} from "lucide-react"
import { useSettings } from "@/contexts/settings-context"

const menuItems = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: Home,
      },
    ],
  },
  {
    title: "Product Management",
    items: [
      {
        title: "Products",
        url: "/products",
        icon: Box,
      },
      {
        title: "BOM & Cost",
        url: "/bom",
        icon: Calculator,
      },
      {
        title: "Inventory",
        url: "/inventory",
        icon: Package,
      },
    ],
  },
  {
    title: "Production",
    items: [
      {
        title: "Printers",
        url: "/printers",
        icon: Printer,
      },
      {
        title: "Components",
        url: "/components",
        icon: Wrench,
      },
      {
        title: "Scheduler",
        url: "/scheduler",
        icon: Calendar,
      },
    ],
  },
  {
    title: "Business",
    items: [
      {
        title: "Orders",
        url: "/orders",
        icon: ShoppingCart,
      },
      {
        title: "Expenses",
        url: "/expenses",
        icon: Receipt,
      },
      {
        title: "Analytics",
        url: "/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        title: "Profile",
        url: "/profile",
        icon: User,
      },
      {
        title: "Settings",
        url: "/settings",
        icon: Settings,
      },
    ],
  },
]

export function AppSidebar() {
  const { settings } = useSettings()

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          {settings.app_logo_url ? (
            <img src={settings.app_logo_url || "/placeholder.svg"} alt="Logo" className="h-8 w-8 rounded" />
          ) : (
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <Box className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold">{settings.app_name}</h2>
            <p className="text-xs text-muted-foreground">Business Management</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {menuItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t px-6 py-4">
        <div className="text-xs text-muted-foreground">
          <p>{settings.footer_text}</p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
