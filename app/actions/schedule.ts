"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { DayOfWeek } from "@prisma/client"
import { getActivePreferences } from "./preferences"

export interface ScheduleSlot {
  id: string
  day: DayOfWeek
  startTime: string
  endTime: string
  subjectName: string | null
  subjectShortName: string | null
  slotTypeName: string
  roomNumber: string | null
  facultyName: string | null
  batchName: string | null
  isBreak: boolean
  hasSummary?: boolean
}

// Slots grouped by day of week (weekly template)
export type WeeklySchedule = Record<DayOfWeek, ScheduleSlot[]>

export interface DaySchedule {
  day: DayOfWeek
  date: string // ISO string for serialization
  slots: ScheduleSlot[]
}

// Calendar event for display on dashboard
export interface DayEvent {
  id: string
  title: string
  description: string | null
  eventTypeName: string
  startDate: string  // ISO date string
  endDate: string | null  // ISO date string
}

const DAYS_ORDER: DayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
]

function getDayOfWeekFromDate(dateStr: string): DayOfWeek {
  const date = new Date(dateStr)
  const dayIndex = date.getDay()
  // getDay() returns 0 for Sunday, 1 for Monday, etc.
  const mapping: DayOfWeek[] = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ]
  return mapping[dayIndex]
}

export async function getUserSchedule(): Promise<{
  weeklySchedule: WeeklySchedule
  todayDate: string
  userName: string
  userRole: string
  slotSummaries: Record<string, string[]> // slotId -> array of ISO date strings with summaries
  dayEvents: Record<string, DayEvent[]> // date string (YYYY-MM-DD) -> events for that date
}> {
  const session = await auth()

  if (!session?.user?.id) {
    const emptySchedule: WeeklySchedule = {
      Monday: [], Tuesday: [], Wednesday: [], Thursday: [],
      Friday: [], Saturday: [], Sunday: []
    }
    return { weeklySchedule: emptySchedule, todayDate: new Date().toISOString(), userName: "", userRole: "", slotSummaries: {}, dayEvents: {} }
  }

  const userId = session.user.id
  const userRole = session.user.role || "Student"
  const today = new Date()

  // Get user's name from database
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true }
  })

  let allSlots: ScheduleSlot[] = []

  // Get groups the user belongs to
  const userGroups = await prisma.groupMembership.findMany({
    where: { userId },
    select: { groupId: true }
  })

  const groupIds = userGroups.map(g => g.groupId)

  if (groupIds.length > 0) {
    // Get timetables assigned to user's groups
    const timetableGroups = await prisma.timetableGroup.findMany({
      where: { groupId: { in: groupIds } },
      include: {
        timetable: {
          include: {
            slots: {
              include: {
                subject: true,
                slotType: true,
                room: true,
                batch: true,
                faculty: true
              },
              orderBy: [
                { day: "asc" },
                { startTime: "asc" }
              ]
            }
          }
        }
      }
    })

    // Collect all slots from all timetables
    const slotsMap = new Map<string, ScheduleSlot>()

    // Get student preferences for filtering (only for students)
    let enabledSlotTypeIds: string[] | null = null
    let selectedBatchIds: string[] | null = null

    if (userRole === "Student") {
      const prefs = await getActivePreferences(userId)
      enabledSlotTypeIds = prefs.enabledSlotTypeIds
      selectedBatchIds = prefs.selectedBatchIds
    }

    for (const tg of timetableGroups) {
      for (const slot of tg.timetable.slots) {
        // For faculty/HOD, only show slots where they are assigned
        // For students, apply preference filters
        let shouldInclude = true

        if (userRole === "HOD" || userRole === "Faculty") {
          shouldInclude = slot.facultyId === userId
        } else {
          // Student filtering
          // Check slot type preference
          if (enabledSlotTypeIds !== null && !enabledSlotTypeIds.includes(slot.slotTypeId)) {
            shouldInclude = false
          }

          // Check batch preference (if user has batch preferences set)
          // Only filter if the slot has a batch AND user has batch preferences
          if (shouldInclude && selectedBatchIds !== null && slot.batchId) {
            if (!selectedBatchIds.includes(slot.batchId)) {
              shouldInclude = false
            }
          }
        }

        if (shouldInclude && !slotsMap.has(slot.id)) {
          slotsMap.set(slot.id, {
            id: slot.id,
            day: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime,
            subjectName: slot.subject?.name || null,
            subjectShortName: slot.subject?.shortName || null,
            slotTypeName: slot.slotType.name,
            roomNumber: slot.room?.number || null,
            facultyName: slot.faculty?.name || null,
            batchName: slot.batch?.name || null,
            isBreak: !slot.subjectId && !slot.roomId
          })
        }
      }
    }

    allSlots = Array.from(slotsMap.values())
  }

  // Get all slot IDs
  const slotIds = allSlots.map(s => s.id)

  // Fetch summaries for all slots (for the next 30 days range)
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysFromNow = new Date(today)
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  const summaries = slotIds.length > 0 ? await prisma.lectureSummary.findMany({
    where: {
      slotId: { in: slotIds },
      date: {
        gte: thirtyDaysAgo,
        lte: thirtyDaysFromNow
      }
    },
    select: {
      slotId: true,
      date: true
    }
  }) : []

  // Build a map of slotId -> array of date strings (YYYY-MM-DD in UTC)
  const slotSummaries: Record<string, string[]> = {}
  for (const summary of summaries) {
    if (!slotSummaries[summary.slotId]) {
      slotSummaries[summary.slotId] = []
    }
    // Use UTC date format to avoid timezone issues on different servers
    const d = summary.date
    const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
    slotSummaries[summary.slotId].push(dateStr)
  }

  // Group slots by day of week (weekly template)
  const weeklySchedule: WeeklySchedule = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: []
  }

  for (const slot of allSlots) {
    weeklySchedule[slot.day].push(slot)
  }

  // Sort each day's slots by start time
  for (const day of Object.keys(weeklySchedule) as DayOfWeek[]) {
    weeklySchedule[day].sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  // Fetch calendar events for user
  // HOD sees all calendars, others only see calendars assigned to their groups
  const dayEvents: Record<string, DayEvent[]> = {}

  // Build the where clause based on user role
  const calendarWhereClause = userRole === "HOD"
    ? {} // HOD sees all calendars
    : groupIds.length > 0
      ? { groups: { some: { groupId: { in: groupIds } } } }
      : null // No groups = no calendars for non-HOD

  if (calendarWhereClause !== null) {
    const calendarEvents = await prisma.calendarEvent.findMany({
      where: {
        ...(Object.keys(calendarWhereClause).length > 0 && { calendar: calendarWhereClause }),
        OR: [
          // Events that start within range
          {
            startDate: {
              gte: thirtyDaysAgo,
              lte: thirtyDaysFromNow
            }
          },
          // Multi-day events that span the range
          {
            startDate: { lte: thirtyDaysFromNow },
            endDate: { gte: thirtyDaysAgo }
          }
        ]
      },
      include: {
        eventType: { select: { name: true } }
      },
      orderBy: { startDate: 'asc' }
    })

    // Map events to their dates
    for (const event of calendarEvents) {
      const startDate = new Date(event.startDate)
      const endDate = event.endDate ? new Date(event.endDate) : startDate

      // For each day the event spans, add it to that day's events
      const currentDate = new Date(startDate)
      while (currentDate <= endDate && currentDate <= thirtyDaysFromNow) {
        if (currentDate >= thirtyDaysAgo) {
          const dateStr = `${currentDate.getUTCFullYear()}-${String(currentDate.getUTCMonth() + 1).padStart(2, '0')}-${String(currentDate.getUTCDate()).padStart(2, '0')}`

          if (!dayEvents[dateStr]) {
            dayEvents[dateStr] = []
          }

          // Avoid duplicates
          if (!dayEvents[dateStr].some(e => e.id === event.id)) {
            dayEvents[dateStr].push({
              id: event.id,
              title: event.title,
              description: event.description,
              eventTypeName: event.eventType.name,
              startDate: event.startDate.toISOString(),
              endDate: event.endDate?.toISOString() || null
            })
          }
        }
        currentDate.setUTCDate(currentDate.getUTCDate() + 1)
      }
    }
  }

  return {
    weeklySchedule,
    todayDate: today.toISOString(),
    userName: user?.name || session.user.name || "",
    userRole,
    slotSummaries,
    dayEvents
  }
}
