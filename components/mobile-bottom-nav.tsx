"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { Session } from "next-auth"
import { MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  MoreMenuContent,
  hodConfigItems,
  moreNavItems,
  primaryNavItems,
} from "@/components/mobile-nav"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type Availability = "Active" | "Away" | "Busy"

const MORE_ROUTE_HREFS = [
  ...moreNavItems.map((item) => item.href),
  "/dashboard/profile",
  ...hodConfigItems.map((item) => item.href),
]

interface MobileBottomNavProps {
  session: Session | null
  userName: string | null
  userAvailability: Availability
  userStatus: string | null
}

export function MobileBottomNav({
  session,
  userName,
  userAvailability,
  userStatus,
}: MobileBottomNavProps) {
  const pathname = usePathname()
  const [isMoreOpen, setIsMoreOpen] = React.useState(false)
  const isMoreActive = MORE_ROUTE_HREFS.some(
    (href) => pathname === href || pathname.startsWith(`${href}/`)
  )

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-red-500 md:hidden">
      <nav className="border-t border-border bg-background shadow-lg">
        <div className="flex h-16 w-full items-center justify-around">
          {primaryNavItems.map((item) => {
            const Icon = item.icon
            // For dashboard, use exact match only; for other items, also match sub-routes
            const isActive = item.href === "/dashboard"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/")

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-0 flex-1",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-6 w-6 shrink-0" />
                <span className="text-[10px] font-medium truncate max-w-full">
                  {item.title}
                </span>
              </Link>
            )
          })}

          <div className="flex flex-1">
            <Popover open={isMoreOpen} onOpenChange={setIsMoreOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex w-full flex-1 flex-col items-center justify-center gap-1 px-3 py-2 min-w-0",
                    isMoreActive || isMoreOpen
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                  aria-haspopup="dialog"
                  aria-expanded={isMoreOpen}
                >
                  <MoreHorizontal className="h-6 w-6 shrink-0" />
                  <span className="text-[10px] font-medium truncate max-w-full">
                    More
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="center"
                sideOffset={12}
                className="w-72 border border-border p-0"
              >
                <MoreMenuContent
                  session={session}
                  userName={userName}
                  userAvailability={userAvailability}
                  userStatus={userStatus}
                  onNavigate={() => setIsMoreOpen(false)}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </nav>
    </div>
  )
}
