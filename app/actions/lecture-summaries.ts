"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { DayOfWeek } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { getActivePreferences } from "./preferences"

export interface LectureSummarySlot {
  id: string
  day: DayOfWeek
  startTime: string
  endTime: string
  subjectName: string | null
  subjectShortName: string | null
  slotTypeName: string
  slotTypeId: string
  roomNumber: string | null
  facultyName: string | null
  facultyId: string | null
  batchName: string | null
  batchId: string | null
  isBreak: boolean
  summary: {
    id: string
    content: string
    notes: string | null
    createdAt: Date
    updatedAt: Date
  } | null
}

export type WeeklyScheduleWithSummaries = Record<DayOfWeek, LectureSummarySlot[]>

// Get faculty's assigned slots with summaries for a specific date
export async function getFacultyScheduleWithSummaries(dateStr: string): Promise<{
  slots: LectureSummarySlot[]
  userRole: string
  canEdit: boolean
}> {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { slots: [], userRole: "", canEdit: false }
  }

  const userId = session.user.id
  const userRole = session.user.role || "Student"
  const canEdit = userRole === "HOD" || userRole === "Faculty"

  // Parse the date to get day of week
  const date = new Date(dateStr)
  const dayIndex = date.getDay()
  const mapping: DayOfWeek[] = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ]
  const dayOfWeek = mapping[dayIndex]
  
  // Create date range for summary filtering
  const startOfDay = new Date(dateStr)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(dateStr)
  endOfDay.setHours(23, 59, 59, 999)

  // Get user's groups
  const userGroups = await prisma.groupMembership.findMany({
    where: { userId },
    select: { groupId: true }
  })

  const groupIds = userGroups.map(g => g.groupId)

  if (groupIds.length === 0) {
    return { slots: [], userRole, canEdit }
  }

  // Get timetables assigned to user's groups
  const timetableGroups = await prisma.timetableGroup.findMany({
    where: { groupId: { in: groupIds } },
    include: {
      timetable: {
        include: {
          slots: {
            where: {
              day: dayOfWeek,
              // For faculty/HOD, only their slots; for students, all slots
              ...(canEdit ? { facultyId: userId } : {})
            },
            include: {
              subject: true,
              slotType: true,
              room: true,
              batch: true,
              faculty: true,
              lectureSummaries: {
                where: {
                  date: {
                    gte: startOfDay,
                    lt: endOfDay
                  }
                }
              }
            },
            orderBy: { startTime: "asc" }
          }
        }
      }
    }
  })

  // Get student preferences for filtering (only for students)
  let enabledSlotTypeIds: string[] | null = null
  let selectedBatchIds: string[] | null = null
  
  if (userRole === "Student") {
    const prefs = await getActivePreferences(userId)
    enabledSlotTypeIds = prefs.enabledSlotTypeIds
    selectedBatchIds = prefs.selectedBatchIds
  }

  // Collect unique slots
  const slotsMap = new Map<string, LectureSummarySlot>()

  for (const tg of timetableGroups) {
    for (const slot of tg.timetable.slots) {
      // Apply student preferences filtering
      let shouldInclude = true
      
      if (userRole === "Student") {
        // Check slot type preference
        if (enabledSlotTypeIds !== null && !enabledSlotTypeIds.includes(slot.slotTypeId)) {
          shouldInclude = false
        }
        
        // Check batch preference (if user has batch preferences set)
        if (shouldInclude && selectedBatchIds !== null && slot.batchId) {
          if (!selectedBatchIds.includes(slot.batchId)) {
            shouldInclude = false
          }
        }
      }

      if (shouldInclude && !slotsMap.has(slot.id)) {
        const summary = slot.lectureSummaries[0] || null
        slotsMap.set(slot.id, {
          id: slot.id,
          day: slot.day,
          startTime: slot.startTime,
          endTime: slot.endTime,
          subjectName: slot.subject?.name || null,
          subjectShortName: slot.subject?.shortName || null,
          slotTypeName: slot.slotType.name,
          slotTypeId: slot.slotTypeId,
          roomNumber: slot.room?.number || null,
          facultyName: slot.faculty?.name || null,
          facultyId: slot.facultyId,
          batchName: slot.batch?.name || null,
          batchId: slot.batchId,
          isBreak: !slot.subjectId && !slot.roomId,
          summary: summary ? {
            id: summary.id,
            content: summary.content,
            notes: summary.notes,
            createdAt: summary.createdAt,
            updatedAt: summary.updatedAt
          } : null
        })
      }
    }
  }

  const slots = Array.from(slotsMap.values()).sort((a, b) => 
    a.startTime.localeCompare(b.startTime)
  )

  return { slots, userRole, canEdit }
}

// Get a specific summary for viewing (students and faculty)
export async function getLectureSummary(slotId: string, dateStr: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)

  const summary = await prisma.lectureSummary.findUnique({
    where: {
      slotId_date: {
        slotId,
        date
      }
    },
    include: {
      createdBy: {
        select: { name: true }
      },
      slot: {
        include: {
          subject: true,
          slotType: true,
          room: true,
          faculty: true,
          batch: true
        }
      }
    }
  })

  if (!summary) {
    return { success: false, error: "Summary not found" }
  }

  return { 
    success: true, 
    summary: {
      id: summary.id,
      content: summary.content,
      notes: summary.notes,
      createdByName: summary.createdBy.name,
      createdAt: summary.createdAt,
      updatedAt: summary.updatedAt,
      slot: {
        subjectName: summary.slot.subject?.name || null,
        slotTypeName: summary.slot.slotType.name,
        startTime: summary.slot.startTime,
        endTime: summary.slot.endTime,
        roomNumber: summary.slot.room?.number || null,
        facultyName: summary.slot.faculty?.name || null,
        batchName: summary.slot.batch?.name || null
      }
    }
  }
}

// Create or update a lecture summary (faculty/HOD only for their slots)
export async function createOrUpdateLectureSummary(
  slotId: string,
  dateStr: string,
  content: string,
  notes?: string
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  const userId = session.user.id
  const userRole = session.user.role

  // Check if user is faculty or HOD
  if (userRole !== "HOD" && userRole !== "Faculty") {
    return { success: false, error: "Only faculty and HOD can create summaries" }
  }

  // Verify that the slot belongs to this faculty
  const slot = await prisma.timeSlot.findUnique({
    where: { id: slotId },
    select: { facultyId: true }
  })

  if (!slot) {
    return { success: false, error: "Slot not found" }
  }

  if (slot.facultyId !== userId) {
    return { success: false, error: "You can only add summaries for your own slots" }
  }

  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)

  try {
    const summary = await prisma.lectureSummary.upsert({
      where: {
        slotId_date: {
          slotId,
          date
        }
      },
      update: {
        content,
        notes: notes || null,
        updatedAt: new Date()
      },
      create: {
        slotId,
        date,
        content,
        notes: notes || null,
        createdById: userId
      }
    })

    revalidatePath("/dashboard/lecture-summaries")
    revalidatePath("/dashboard")

    return { success: true, summary }
  } catch (error) {
    console.error("Error creating/updating summary:", error)
    return { success: false, error: "Failed to save summary" }
  }
}

// Delete a lecture summary (faculty/HOD only for their slots)
export async function deleteLectureSummary(summaryId: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  const userId = session.user.id
  const userRole = session.user.role

  // Check if user is faculty or HOD
  if (userRole !== "HOD" && userRole !== "Faculty") {
    return { success: false, error: "Only faculty and HOD can delete summaries" }
  }

  // Get the summary and verify ownership
  const summary = await prisma.lectureSummary.findUnique({
    where: { id: summaryId },
    include: {
      slot: {
        select: { facultyId: true }
      }
    }
  })

  if (!summary) {
    return { success: false, error: "Summary not found" }
  }

  if (summary.slot.facultyId !== userId) {
    return { success: false, error: "You can only delete summaries for your own slots" }
  }

  try {
    await prisma.lectureSummary.delete({
      where: { id: summaryId }
    })

    revalidatePath("/dashboard/lecture-summaries")
    revalidatePath("/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Error deleting summary:", error)
    return { success: false, error: "Failed to delete summary" }
  }
}
