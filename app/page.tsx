import { auth } from "@/auth"

import { Credits } from "@/components/landing/credits"
import { FeaturesGrid } from "@/components/landing/features-grid"
import { HeroBand, type HeroUser } from "@/components/landing/hero-band"
import { SiteFooter } from "@/components/landing/site-footer"
import { SiteHeader } from "@/components/landing/site-header"
import { Voices } from "@/components/landing/voices"

export default async function LandingPage() {
  const session = await auth()

  const user: HeroUser | null = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      }
    : null

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader signedIn={Boolean(user)} />
      <main className="flex-1">
        <HeroBand user={user} />
        <FeaturesGrid />
        <Voices />
        <Credits />
      </main>
      <SiteFooter />
    </div>
  )
}
