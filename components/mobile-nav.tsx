"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, User, BookOpen, DoorOpen, Clock, Eye, Calendar, Settings, Users, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Session } from "next-auth"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface MobileNavProps {
  session: Session | null
}

export function MobileNav({ session }: MobileNavProps) {
  const pathname = usePathname()
  const [configOpen, setConfigOpen] = React.useState(false)

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Timetable",
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
      icon: Eye,
    },
    {
      title: "Profile",
      href: "/dashboard/profile",
      icon: User,
    },
  ]

  const configItems = [
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

  const isConfigActive = configItems.some(item => pathname === item.href)

  // Only show config for HOD
  const showConfig = session?.user?.role === "HOD"

  return (
    <nav className="bg-background border-t fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-4 py-2 text-xs transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{item.title}</span>
          </Link>
        )
      })}

      {showConfig && (
        <Popover open={configOpen} onOpenChange={setConfigOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 text-xs transition-colors",
                isConfigActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Settings className="h-5 w-5" />
              <span>Config</span>
            </button>
          </PopoverTrigger>
          <PopoverContent 
            side="top" 
            align="end" 
            className="w-48 p-2"
            sideOffset={8}
          >
            <div className="grid gap-1">
              {configItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setConfigOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                )
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </nav>
  )
}

