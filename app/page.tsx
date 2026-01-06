import Link from "next/link"
import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Hero } from "@/components/ui/hero"
import { FeaturesSectionWithHoverEffects } from "@/components/ui/feature-section-with-hover-effects"
import { TestimonialsSection } from "@/components/ui/testimonials-with-marquee"
import { LandingPageWrapper } from "@/components/landing-page-wrapper"
import { 
  Calendar, 
  Users, 
  Clock, 
  BookOpen, 
  LayoutDashboard,
  ArrowRight,
  CheckCircle2,
  Sparkles
} from "lucide-react"

export default async function LandingPage() {
  const session = await auth()

  return (
    <LandingPageWrapper>
      <div className="min-h-screen bg-linear-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">CampusSync</span>
          </div>
          
          <nav className="flex items-center gap-4">
            {session ? (
              <Button asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <Hero
        title={
          <>
            Smart Timetable Management
            <br />
            <span className="text-primary">for Modern Campuses</span>
          </>
        }
        subtitle="CampusSync helps students, faculty, and administrators manage schedules effortlessly. View availability, coordinate rooms, and never miss a class again."
        actions={
          session
            ? [
                {
                  label: "Go to Dashboard",
                  href: "/dashboard",
                  variant: "default" as const,
                  size: "lg" as const,
                },
              ]
            : [
                {
                  label: "Get Started Free",
                  href: "/signup",
                  variant: "default" as const,
                  size: "lg" as const,
                },
                {
                  label: "Log in to your account",
                  href: "/login",
                  variant: "outline" as const,
                  size: "lg" as const,
                },
              ]
        }
        titleClassName="text-4xl md:text-6xl"
        subtitleClassName="text-lg max-w-2xl"
        actionsClassName="flex-col sm:flex-row mt-8"
      />

      {/* Features Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Everything you need</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Powerful features designed to make campus scheduling simple and efficient
          </p>
        </div>

        <FeaturesSectionWithHoverEffects />
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection
        title="Trusted by educators and administrators"
        description="See what faculty and staff are saying about CampusSync"
        testimonials={[
          {
            author: {
              name: "Dr. Kiran Deshpande",
              handle: "Head of Department",
              avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmnXeTYieQCBz4OYBU0-73sWLJssuj-i95Nw&s",
            },
            text: "CampusSync has significantly streamlined how our department manages schedules. Faculty availability, room allocation, and timetable changes are now handled in one place, reducing confusion and last-minute issues. It has brought much-needed structure and transparency to our academic planning.",
          },
          {
            author: {
              name: "Prof. Vishal Badgujar",
              handle: "Professor",
              avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQG9PV54aUfKiQjG67GGSRl-z6LhMWCJKl_nQ&s",
            },
            text: "What I appreciate most about CampusSync is its simplicity. Updating my availability and checking daily schedules takes seconds. It has eliminated countless WhatsApp messages and emails, allowing me to focus more on teaching rather than coordination.",
          },
          {
            author: {
              name: "Prof. Charul Singh",
              handle: "Professor",
              avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKtZ7Gp8unhP04UbaWuVqKotaul394SeOXqA&s",
            },
            text: "CampusSync has made timetable management far more efficient for faculty. The ability to view room and faculty availability in real time helps avoid clashes and improves overall planning. It feels purpose-built for modern academic workflows.",
          },
          {
            author: {
              name: "Prof. Sonal Jain",
              handle: "Professor",
              avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIzxRzQPp6lyIQyi8olsThWMOBe8TGOgCFGg&s",
            },
            text: "With CampusSync, coordinating schedules across multiple batches is no longer a challenge. The centralized dashboard and clear visibility into timetables have made academic coordination smoother, more reliable, and far less time-consuming.",
          },
        ]}
      />

      {/* CTA Section */}
      <section className="relative w-full overflow-hidden py-16 md:py-24 bg-linear-to-r from-primary/10 via-primary/5 to-primary/10 dark:from-primary/40 dark:via-primary/30 dark:to-primary/40 animate-cta-gradient">
        <div className="relative z-10 container mx-auto px-6 text-center text-foreground">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join CampusSync today and transform how your campus manages schedules.
          </p>
          {session ? (
            <Button size="lg" variant="secondary" asChild>
              <Link href="/dashboard">
                Open Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          ) : (
            <Button size="lg" variant="secondary" asChild>
              <Link href="/signup">
                Create Free Account
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">CampusSync</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} CampusSync. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </LandingPageWrapper>
  )
}