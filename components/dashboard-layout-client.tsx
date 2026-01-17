"use client"

import * as React from "react"
import { useOptimistic, useTransition } from "react"
import type { Session } from "next-auth"
import { Sidebar } from "@/components/sidebar"
import { MobileHeader } from "@/components/mobile-header"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"

type Availability = "Active" | "Away" | "Busy"

export function DashboardLayoutClient({
  children,
  session,
  userName,
  userAvailability,
  userStatus,
}: {
  children: React.ReactNode
  session: Session | null
  userName: string | null
  userAvailability: Availability
  userStatus: string | null
}) {
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [isPending, startTransition] = useTransition()
  
  // Optimistic state for instant UI updates
  const [optimisticCollapsed, setOptimisticCollapsed] = useOptimistic(
    isCollapsed,
    (currentState, newState: boolean) => newState
  )

  const handleToggle = React.useCallback(() => {
    const newState = !optimisticCollapsed
    
    // Optimistically update UI immediately
    setOptimisticCollapsed(newState)
    
    // Update actual state in a transition (non-blocking)
    startTransition(() => {
      setIsCollapsed(newState)
    })
  }, [optimisticCollapsed, setOptimisticCollapsed])

  return (
    <div className="flex h-screen w-screen flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <MobileHeader session={session} />

      {/* Desktop Sidebar */}
      <div className="hidden md:block shrink-0">
        <Sidebar
          session={session}
          isCollapsed={optimisticCollapsed}
          onToggle={handleToggle}
          userName={userName}
          userAvailability={userAvailability}
          userStatus={userStatus}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden pt-14 md:pt-0">
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav
        session={session}
        userName={userName}
        userAvailability={userAvailability}
        userStatus={userStatus}
      />
    </div>
  )
}

