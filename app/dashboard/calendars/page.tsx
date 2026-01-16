import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { CalendarsClient } from "./calendars-client"
import {
  getCalendars,
  getAllGroupsForCalendar,
} from "@/app/actions/calendars"

export default async function CalendarsPage() {
  const session = await auth()
  if (!session?.user?.email) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, name: true }
  })

  if (!user) {
    redirect("/login")
  }

  const isHOD = user.role === "HOD"

  // Fetch all data
  const [calendars, groups] = await Promise.all([
    getCalendars(),
    isHOD ? getAllGroupsForCalendar() : Promise.resolve([]),
  ])

  return (
    <CalendarsClient
      calendars={calendars}
      groups={groups}
      isHOD={isHOD}
      userId={user.id}
    />
  )
}
