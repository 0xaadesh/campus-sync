"use client"

import * as React from "react"
import { signOut } from "next-auth/react"
import { LogOut, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Spinner } from "@/components/ui/spinner"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { MobileNav } from "@/components/mobile-nav"
import type { Session } from "next-auth"

interface MobileHeaderProps {
  session: Session | null
}

export function MobileHeader({ session }: MobileHeaderProps) {
  const [isSigningOut, setIsSigningOut] = React.useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)

  return (
    <header className="bg-background border-b fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between gap-2 px-4 md:hidden">
      {/* Left: Menu Trigger */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Open menu"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-70 sm:w-80">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SheetDescription className="sr-only">
            Navigate to different sections of the application
          </SheetDescription>
          <MobileNav 
            session={session} 
            isOpen={isDrawerOpen} 
            onClose={() => setIsDrawerOpen(false)} 
          />
        </SheetContent>
      </Sheet>

      {/* Right: Theme Toggle & Sign Out */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsSigningOut(true)
            signOut({ callbackUrl: "/login" })
          }}
          disabled={isSigningOut}
          className="h-8 w-8"
          aria-label="Sign out"
        >
          {isSigningOut ? (
            <Spinner size="sm" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
        </Button>
      </div>
    </header>
  )
}

