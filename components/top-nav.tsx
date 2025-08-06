"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Bell, Settings, LogOut, Users, User, Moon, Sun, Package, ShoppingCart, Box } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "next-themes"
import { UserManagementModal } from "@/components/user-management-modal"
import { useRouter } from "next/navigation"

export function TopNav() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [showUserManagement, setShowUserManagement] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)

  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notificationsError, setNotificationsError] = useState(false)
  const [lastNotificationCheck, setLastNotificationCheck] = useState<number>(0)

  useEffect(() => {
    if (user) {
      fetchNotifications()
      // Real-time polling - check every 10 seconds for new notifications
      const interval = setInterval(() => {
        const now = Date.now()
        if (now - lastNotificationCheck > 10000) { // Only check if 10 seconds have passed
          fetchNotifications()
          setLastNotificationCheck(now)
        }
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [user, lastNotificationCheck])

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        console.log("No auth token found")
        return
      }

      const response = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Notifications fetch failed:", response.status, response.statusText, errorText)
        setNotificationsError(true)
        return
      }

      const data = await response.json()
      if (data.error) {
        console.error("API returned error:", data.error)
        setNotificationsError(true)
        return
      }

      const newNotifications = data.notifications || []
      const newUnreadCount = newNotifications.filter((n: any) => !n.read).length
      
      // Check if there are new unread notifications
      if (newUnreadCount > unreadCount) {
        // Show a subtle notification that new notifications arrived
        console.log(`New notifications received: ${newUnreadCount - unreadCount} unread`)
      }
      
      setNotifications(newNotifications)
      setUnreadCount(newUnreadCount)
      setNotificationsError(false)
    } catch (error) {
      console.error("Notifications fetch error:", error)
      setNotificationsError(true)
      // Set empty state on error
      setNotifications([])
      setUnreadCount(0)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        // Update local state immediately for better UX
        setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
        
        // Refresh notifications to ensure sync
        setTimeout(() => {
          fetchNotifications()
        }, 1000)
      }
    } catch (error) {
      console.error("Mark notification as read error:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter(n => !n.read)
      
      for (const notification of unreadNotifications) {
        const response = await fetch(`/api/notifications/${notification.id}/read`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          console.error(`Failed to mark notification ${notification.id} as read`)
        }
      }

      // Clear old notifications (older than 7 days) and reset unread count
      const response = await fetch("/api/notifications/clear", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        // Clear local state
        setNotifications([])
        setUnreadCount(0)
      } else {
        console.error("Failed to clear notifications after marking as read")
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const clearAllNotifications = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      const response = await fetch("/api/notifications/clear", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        // Clear local state
        setNotifications([])
        setUnreadCount(0)
      } else {
        console.error("Failed to clear notifications")
      }
    } catch (error) {
      console.error("Error clearing all notifications:", error)
    }
  }

  if (!user) return null

  const handleLogout = async () => {
    await logout()
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const results = await response.json()
        setSearchResults(results)
        setShowSearchResults(results.length > 0)
      }
    } catch (error) {
      console.error("Search error:", error)
      setSearchResults([])
      setShowSearchResults(false)
    }
  }

  return (
    <>
      <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
        <div className="flex-1 relative">
          <form className="relative" onSubmit={(e) => e.preventDefault()}>
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              name="search"
              type="search"
              placeholder="Search products, orders, inventory..."
              className="w-full max-w-md pl-8"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            />
          </form>

          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 max-w-md bg-background border rounded-md shadow-lg z-50 mt-1 max-h-80 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((result, index) => {
                  const getIcon = (type: string) => {
                    switch (type) {
                      case 'Product':
                        return <Package className="h-4 w-4" />
                      case 'Order':
                        return <ShoppingCart className="h-4 w-4" />
                      case 'Inventory':
                        return <Box className="h-4 w-4" />
                      default:
                        return <Search className="h-4 w-4" />
                    }
                  }

                  return (
                    <div 
                      key={index} 
                      className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0 flex items-center gap-3"
                      onClick={() => {
                        router.push(result.url)
                        setShowSearchResults(false)
                        setSearchQuery("")
                      }}
                    >
                      <div className="text-muted-foreground">
                        {getIcon(result.type)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{result.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {result.type} • {result.description}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="p-3 text-center text-muted-foreground">
                  <Search className="h-4 w-4 mx-auto mb-2" />
                  <div className="text-sm">No results found</div>
                  <div className="text-xs">Try searching for products, orders, or inventory</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notificationsError ? (
                <div className="p-4 text-center text-muted-foreground">
                  <p>Unable to load notifications</p>
                  <Button variant="ghost" size="sm" onClick={fetchNotifications} className="mt-2">
                    Try again
                  </Button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No notifications</div>
              ) : (
                <>
                  {notifications.length > 0 && (
                    <div className="p-2 border-b flex gap-2">
                      {unreadCount > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={markAllAsRead}
                          className="flex-1 text-xs"
                        >
                          Mark all as read
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearAllNotifications}
                        className="flex-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                      >
                        Clear all
                      </Button>
                    </div>
                  )}
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className={`p-3 cursor-pointer ${!notification.read ? "bg-blue-50 dark:bg-blue-950" : ""}`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex flex-col space-y-1 w-full">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{notification.title}</span>
                            {!notification.read && <div className="h-2 w-2 bg-blue-500 rounded-full"></div>}
                          </div>
                          <p className="text-xs text-muted-foreground">{notification.message}</p>
                          <p className="text-xs text-muted-foreground">{notification.created_at}</p>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-user.jpg" alt={user.full_name} />
                  <AvatarFallback>
                    {user.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.full_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  <p className="text-xs leading-none text-muted-foreground capitalize">
                    {user.role} • {user.department}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              {user.role === "admin" && (
                <DropdownMenuItem onClick={() => setShowUserManagement(true)}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Manage Users</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <UserManagementModal open={showUserManagement} onOpenChange={setShowUserManagement} />
    </>
  )
}
