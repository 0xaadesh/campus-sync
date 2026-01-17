import { Suspense } from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { DashboardSkeleton } from "@/components/dashboard-skeleton"
import { ScheduleCarousel } from "@/components/schedule-carousel"
import { getUserSchedule } from "@/app/actions/schedule"

async function DashboardContent() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const { weeklySchedule, todayDate, userName, slotSummaries, dayEvents } = await getUserSchedule()

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Welcome back, {userName || "User"}!
        </p>
      </div>

      {/* Schedule Section */}
      <div>
        <ScheduleCarousel weeklySchedule={weeklySchedule} todayDate={todayDate} slotSummaries={slotSummaries} dayEvents={dayEvents} />
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}

