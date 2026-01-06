"use client"

export function LandingPageWrapper({ children }: { children: React.ReactNode }) {
  // Respect the active theme from next-themes; no forced overrides here.
  return <>{children}</>
}

