import Image from "next/image"
import Link from "next/link"

import { ArrowRight, LayoutDashboard } from "lucide-react"

import { Button } from "@/components/ui/button"

const SECTION_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Voices", href: "#voices" },
  { label: "Team", href: "#team" },
]

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="bg-background/90 sticky top-0 z-50 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-6 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/campus-sync-circular.svg"
            alt=""
            width={24}
            height={24}
            className="size-6"
          />
          <span className="font-mono text-sm tracking-[0.18em] uppercase">
            CampusSync
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {SECTION_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground font-mono text-xs tracking-[0.18em] uppercase transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {signedIn ? (
            <Button asChild>
              <Link href="/dashboard">
                <LayoutDashboard data-icon="inline-start" />
                Dashboard
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">
                  Sign up
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
