"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ChevronLeft, ChevronRight, BookOpen, DoorOpen, Clock, Users, CalendarDays, Layers, LogOut, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { signOut } from "next-auth/react"
import type { Session } from "next-auth"
import { Spinner } from "@/components/ui/spinner"

type Availability = "Active" | "Away" | "Busy"

interface SidebarProps {
  session: Session | null
  isCollapsed: boolean
  onToggle: () => void
  userName: string | null
  userAvailability: Availability
  userStatus: string | null
}

export function Sidebar({ session, isCollapsed, onToggle, userName, userAvailability, userStatus }: SidebarProps) {
  const pathname = usePathname()
  const [isSigningOut, setIsSigningOut] = React.useState(false)

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
  ]

  const getAvailabilityColor = (av: Availability) => {
    switch (av) {
      case "Active": return "bg-green-500"
      case "Away": return "bg-red-500"
      case "Busy": return "bg-yellow-500"
    }
  }

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground border-sidebar-border flex h-screen flex-col border-r transition-all duration-200 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="border-sidebar-border flex h-16 items-center justify-between border-b px-4">
        {!isCollapsed && (
          <h2 className="text-sidebar-foreground text-sm font-semibold">
            Campus Sync
          </h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 transition-transform duration-200 hover:scale-110"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 transition-transform duration-200" />
          ) : (
            <ChevronLeft className="h-4 w-4 transition-transform duration-200" />
          )}
        </Button>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200",
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                isCollapsed && "justify-center"
              )}
            >
              <Icon className="h-4 w-4 shrink-0 transition-transform duration-200" />
              {!isCollapsed && (
                <span className="animate-in fade-in duration-200">{item.title}</span>
              )}
            </Link>
          )
        })}

        {/* HOD Only Sections */}
        {session?.user?.role === "HOD" && (
          <>
            <Separator className="my-2" />
            <Link
              href="/dashboard/subjects"
              className={cn(
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200",
                pathname === "/dashboard/subjects" &&
                  "bg-sidebar-accent text-sidebar-accent-foreground",
                isCollapsed && "justify-center"
              )}
            >
              <BookOpen className="h-4 w-4 shrink-0 transition-transform duration-200" />
              {!isCollapsed && (
                <span className="animate-in fade-in duration-200">Subjects</span>
              )}
            </Link>
            <Link
              href="/dashboard/rooms"
              className={cn(
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200",
                pathname === "/dashboard/rooms" &&
                  "bg-sidebar-accent text-sidebar-accent-foreground",
                isCollapsed && "justify-center"
              )}
            >
              <DoorOpen className="h-4 w-4 shrink-0 transition-transform duration-200" />
              {!isCollapsed && (
                <span className="animate-in fade-in duration-200">Rooms</span>
              )}
            </Link>
            <Link
              href="/dashboard/slot-types"
              className={cn(
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200",
                pathname === "/dashboard/slot-types" &&
                  "bg-sidebar-accent text-sidebar-accent-foreground",
                isCollapsed && "justify-center"
              )}
            >
              <Clock className="h-4 w-4 shrink-0 transition-transform duration-200" />
              {!isCollapsed && (
                <span className="animate-in fade-in duration-200">Slot Types</span>
              )}
            </Link>
            <Link
              href="/dashboard/batches"
              className={cn(
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200",
                pathname === "/dashboard/batches" &&
                  "bg-sidebar-accent text-sidebar-accent-foreground",
                isCollapsed && "justify-center"
              )}
            >
              <Layers className="h-4 w-4 shrink-0 transition-transform duration-200" />
              {!isCollapsed && (
                <span className="animate-in fade-in duration-200">Batches</span>
              )}
            </Link>
          </>
        )}

        {/* Timetables & Groups - Available to all roles */}
        <Separator className="my-2" />
        <Link
          href="/dashboard/timetables"
          className={cn(
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200",
            pathname === "/dashboard/timetables" &&
              "bg-sidebar-accent text-sidebar-accent-foreground",
            isCollapsed && "justify-center"
          )}
        >
          <CalendarDays className="h-4 w-4 shrink-0 transition-transform duration-200" />
          {!isCollapsed && (
            <span className="animate-in fade-in duration-200">Timetables</span>
          )}
        </Link>
        <Link
          href="/dashboard/groups"
          className={cn(
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200",
            pathname === "/dashboard/groups" &&
              "bg-sidebar-accent text-sidebar-accent-foreground",
            isCollapsed && "justify-center"
          )}
        >
          <Users className="h-4 w-4 shrink-0 transition-transform duration-200" />
          {!isCollapsed && (
            <span className="animate-in fade-in duration-200">Groups</span>
          )}
        </Link>
        <Link
          href="/dashboard/availability"
          className={cn(
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200",
            pathname === "/dashboard/availability" &&
              "bg-sidebar-accent text-sidebar-accent-foreground",
            isCollapsed && "justify-center"
          )}
        >
          <Eye className="h-4 w-4 shrink-0 transition-transform duration-200" />
          {!isCollapsed && (
            <span className="animate-in fade-in duration-200">Availability</span>
          )}
        </Link>
        <Link
          href="/dashboard/lecture-summaries"
          className={cn(
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200",
            pathname === "/dashboard/lecture-summaries" &&
              "bg-sidebar-accent text-sidebar-accent-foreground",
            isCollapsed && "justify-center"
          )}
        >
          <BookOpen className="h-4 w-4 shrink-0 transition-transform duration-200" />
          {!isCollapsed && (
            <span className="animate-in fade-in duration-200">Lecture Summaries</span>
          )}
        </Link>
      </nav>

      {/* Theme Toggle */}
      <div className="border-sidebar-border border-t p-2">
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "px-2")}>
          <ThemeToggle />
        </div>
      </div>

      {/* Profile Section at Bottom */}
      <div className="border-sidebar-border border-t p-3">
        {!session?.user ? (
          /* Skeleton loading state */
          <div className="p-2">
            <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              )}
            </div>
          </div>
        ) : (
          <Link
            href="/dashboard/profile"
            className={cn(
              "hover:bg-sidebar-accent rounded-md p-2 transition-all duration-200 block",
              pathname === "/dashboard/profile" && "bg-sidebar-accent"
            )}
          >
            <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
              {/* Avatar with availability indicator */}
              <div className="relative">
                <div className="bg-sidebar-accent text-sidebar-accent-foreground flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium shrink-0">
                  {userName?.charAt(0).toUpperCase() || "U"}
                </div>
                <span 
                  className={cn(
                    "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-sidebar",
                    getAvailabilityColor(userAvailability)
                  )} 
                />
              </div>

              {/* User info - only when expanded */}
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-sidebar-foreground text-sm font-medium truncate">
                    {userName || "User"}
                  </div>
                  {userStatus && (
                    <div className="text-muted-foreground text-xs truncate">
                      {userStatus}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Link>
        )}

        {/* Logout button */}
        {!isCollapsed ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsSigningOut(true)
              signOut({ callbackUrl: "/login" })
            }}
            disabled={isSigningOut}
            className="w-full justify-start mt-2"
          >
            {isSigningOut ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <LogOut className="h-4 w-4 mr-2" />
            )}
            Sign Out
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsSigningOut(true)
              signOut({ callbackUrl: "/login" })
            }}
            disabled={isSigningOut}
            className="w-full mt-2"
            aria-label="Sign out"
          >
            {isSigningOut ? (
              <Spinner size="sm" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </aside>
  )
}

