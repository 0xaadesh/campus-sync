import {
  CalendarDays,
  CalendarRange,
  ClipboardList,
  Clock4,
  DoorOpen,
  Users,
} from "lucide-react"

import { BlurFade } from "@/components/ui/blur-fade"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { GridPattern } from "@/components/ui/grid-pattern"

const FEATURES = [
  {
    index: "01",
    icon: CalendarRange,
    title: "Timetables",
    description: "Lay out the week once. Publish it, or export it as a PDF.",
    span: "md:col-span-5",
  },
  {
    index: "02",
    icon: CalendarDays,
    title: "Calendars & events",
    description: "Holidays, exams and one-offs on the same grid.",
    span: "md:col-span-4",
  },
  {
    index: "03",
    icon: Users,
    title: "Groups",
    description: "Share a schedule with one join code.",
    span: "md:col-span-3",
  },
  {
    index: "04",
    icon: Clock4,
    title: "Availability",
    description: "Who's free, when. Overlaps caught before you publish.",
    span: "md:col-span-3",
  },
  {
    index: "05",
    icon: DoorOpen,
    title: "Rooms & subjects",
    description: "Rooms, subjects, batches and slot types in one place.",
    span: "md:col-span-5",
  },
  {
    index: "06",
    icon: ClipboardList,
    title: "Lecture summaries",
    description: "What was covered, attached to the slot it belongs to.",
    span: "md:col-span-4",
  },
]

export function FeaturesGrid() {
  return (
    <section id="features" className="relative isolate overflow-hidden border-t">
      <GridPattern
        width={56}
        height={56}
        className="stroke-border fill-border/40 [mask-image:radial-gradient(70%_70%_at_50%_0%,black,transparent)]"
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="mb-12 flex flex-col gap-4 md:mb-16 md:max-w-xl">
          <p className="text-muted-foreground font-mono text-xs tracking-[0.22em] uppercase">
            Capabilities
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-5xl">
            Six surfaces, one source of truth.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon
            return (
              <BlurFade
                key={feature.index}
                delay={0.05 * i}
                inView
                inViewMargin="-80px"
                className={feature.span}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <Icon className="size-5" />
                      <span className="text-muted-foreground font-mono text-xs tracking-[0.22em]">
                        {feature.index}
                      </span>
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </BlurFade>
            )
          })}
        </div>
      </div>
    </section>
  )
}
