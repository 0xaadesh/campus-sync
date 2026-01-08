"use client"

import * as React from "react"
import type { Session } from "next-auth"
import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Spinner } from "@/components/ui/spinner"

interface MobileHeaderProps {
  session: Session | null
}

export function MobileHeader({ session }: MobileHeaderProps) {
  const [isSigningOut, setIsSigningOut] = React.useState(false)

  return (
    <header className="bg-background border-b fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between gap-2 px-4 md:hidden">
      <div className="flex-1" />

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        {session?.user && (
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
        )}
      </div>
    </header>
  )
}

