"use client"

import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const routeNames: Record<string, string> = {
  "/": "Dashboard",
  "/products": "Products",
  "/bom": "BOM & Cost",
  "/inventory": "Inventory",
  "/printers": "Printers",
  "/scheduler": "Scheduler",
  "/orders": "Orders",
  "/expenses": "Expenses",
  "/analytics": "Analytics",
  "/profile": "Profile",
  "/settings": "Settings",
}

export function BreadcrumbNav() {
  const pathname = usePathname()

  const pathSegments = pathname.split("/").filter(Boolean)
  const currentPageName = routeNames[pathname] || "Page"

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        {pathname !== "/" && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{currentPageName}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
