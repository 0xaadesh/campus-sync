import { Suspense } from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { LectureSummaryCarousel } from "@/components/lecture-summary-carousel"
import { getFacultyScheduleWithSummaries } from "@/app/actions/lecture-summaries"
import { FileText } from "lucide-react"

function LectureSummariesSkeleton() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      
      {/* Date selector skeleton */}
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-10 w-10" />
        <div className="flex-1 flex gap-2 overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-16 shrink-0" />
          ))}
        </div>
        <Skeleton className="h-10 w-10" />
      </div>
      
      {/* Day header skeleton */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-5 w-24" />
      </div>
      
      {/* Info box skeleton */}
      <Skeleton className="h-12 w-full mb-4" />
      
      {/* Cards skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  )
}

async function LectureSummariesContent() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  
  const { slots, userRole, canEdit } = await getFacultyScheduleWithSummaries(todayStr)

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Lecture Summaries</h1>
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          {canEdit 
            ? "Add and manage summaries for your lectures"
            : "View lecture summaries from your faculty"
          }
        </p>
      </div>

      <LectureSummaryCarousel 
        initialSlots={slots} 
        todayDate={today.toISOString()} 
        userRole={userRole}
        canEdit={canEdit}
      />
    </div>
  )
}

export default async function LectureSummariesPage() {
  return (
    <Suspense fallback={<LectureSummariesSkeleton />}>
      <LectureSummariesContent />
    </Suspense>
  )
}
