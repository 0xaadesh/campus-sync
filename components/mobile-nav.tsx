"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  BookOpen,
  Calendar,
  Clock,
  DoorOpen,
  Layers,
  LayoutDashboard,
  User,
  Users,
} from "lucide-react"
import type { Session } from "next-auth"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>
type Availability = "Active" | "Away" | "Busy"

interface NavItem {
  title: string
  href: string
  icon: IconComponent
}

export const primaryNavItems: readonly NavItem[] = [
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
] as const

export const moreNavItems: readonly NavItem[] = [
  {
    title: "Lecture Summaries",
    href: "/dashboard/lecture-summaries",
    icon: BookOpen,
  },
] as const

export const hodConfigItems: readonly NavItem[] = [
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
] as const

const profileNavItem: NavItem = {
  title: "Profile",
  href: "/dashboard/profile",
  icon: User,
}

const getInitials = (name: string | null | undefined) => {
  if (!name) return "U"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const availabilityColorMap: Record<Availability, string> = {
  Active: "bg-green-500",
  Away: "bg-red-500",
  Busy: "bg-yellow-500",
}

interface MoreMenuContentProps {
  session: Session | null
  onNavigate?: () => void
  userName?: string | null
  userAvailability?: Availability
  userStatus?: string | null
}

export function MoreMenuContent({
  session,
  onNavigate,
  userName,
  userAvailability = "Active",
  userStatus,
}: MoreMenuContentProps) {
  const pathname = usePathname()
  const showHodSection = session?.user?.role === "HOD"
  const resolvedName = userName ?? session?.user?.name ?? "User"
  const availabilityLabel = userAvailability ?? "Active"
  const statusText = userStatus?.trim() || ""
  const initials = getInitials(resolvedName)
  const availabilityDotClass = availabilityColorMap[availabilityLabel as Availability]

  const handleNavigate = () => {
    onNavigate?.()
  }

  const renderLink = (item: NavItem) => {
    const Icon = item.icon
    const isActive =
      pathname === item.href || pathname.startsWith(`${item.href}/`)

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={handleNavigate}
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
  }

  return (
    <div className="flex max-h-[70vh] w-72 flex-col overflow-hidden rounded-md">
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {moreNavItems.map((item) => renderLink(item))}
        </div>

        {showHodSection && (
          <div className="mt-4">
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Configuration
            </p>
            <div className="space-y-1">
              {hodConfigItems.map((item) => renderLink(item))}
            </div>
          </div>
        )}

        <Separator className="my-3" />

        <div>
          {(() => {
            const isActive =
              pathname === profileNavItem.href ||
              pathname.startsWith(`${profileNavItem.href}/`)
            return (
              <Link
                key={profileNavItem.href}
                href={profileNavItem.href}
                onClick={handleNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="relative">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {initials}
                  </div>
                  <span
                    className={cn(
                      "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                      availabilityDotClass
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-medium text-foreground">
                    {resolvedName}
                  </p>
                  {statusText && (
                    <p className="truncate text-xs text-muted-foreground">
                      {statusText}
                    </p>
                  )}
                </div>
              </Link>
            )
          })()}
        </div>
      </div>

    </div>
  )
}

