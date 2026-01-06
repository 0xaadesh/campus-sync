"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, User, BookOpen, DoorOpen, Clock, Calendar, Users, Layers, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Session } from "next-auth"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

interface MobileNavProps {
  session: Session | null
  isOpen: boolean
  onClose: () => void
}

export function MobileNav({ session, isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname()

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Timetables",
      href: "/dashboard/timetables",
      icon: Calendar,
    },
    {
      title: "Groups",
      href: "/dashboard/groups",
      icon: Users,
    },
    {
      title: "Availability",
      href: "/dashboard/availability",
      icon: Activity,
    },
    {
      title: "Lecture Summaries",
      href: "/dashboard/lecture-summaries",
      icon: BookOpen,
    },
  ]

  const hodConfigItems = [
    {
      title: "Subjects",
      href: "/dashboard/subjects",
      icon: BookOpen,
    },
    {
      title: "Rooms",
      href: "/dashboard/rooms",
      icon: DoorOpen,
    },
    {
      title: "Slot Types",
      href: "/dashboard/slot-types",
      icon: Clock,
    },
    {
      title: "Batches",
      href: "/dashboard/batches",
      icon: Layers,
    },
  ]

  const showHodSection = session?.user?.role === "HOD"

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (!isOpen) return null

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        {/* HOD Configuration Section */}
      {showHodSection && (
        <>
          <div className="mb-2">
            <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Configuration
            </h3>
            <div className="space-y-1">
              {hodConfigItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          <Separator className="my-4" />
        </>
      )}

      {/* Main Navigation Section */}
      <div className="mb-2">
        <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Navigation
        </h3>
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </div>
      </div>

      <Separator className="my-4" />

      {/* Profile Link */}
      <Link
        href="/dashboard/profile"
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          pathname === "/dashboard/profile"
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <User className="h-4 w-4" />
        <span>Profile</span>
      </Link>
      </div>

      {/* User Profile Section at Bottom */}
      <div className="mt-auto border-t pt-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(session?.user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <p className="text-sm font-medium truncate">{session?.user?.name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

