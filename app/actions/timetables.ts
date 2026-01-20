"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// Types for timetable data
export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday"

export type TimeSlotData = {
  id?: string
  day: DayOfWeek
  startTime: string
  endTime: string
  subjectId?: string
  slotTypeId: string
  roomId?: string
  facultyId?: string
  batchId?: string
}

export type TimetableWithSlots = {
  id: string
  name: string
  description: string | null
  createdById: string
  createdBy: { id: string; name: string }
  createdAt: Date
  slots: {
    id: string
    day: DayOfWeek
    startTime: string
    endTime: string
    subject: { id: string; name: string; shortName: string }
    slotType: { id: string; name: string }
    room: { id: string; number: string }
    faculty: { id: string; name: string }
  }[]
  groups: {
    id: string
    group: { id: string; title: string; defaultRole: string }
  }[]
}

// Get current user helper
async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.email) return null
  return prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, email: true, name: true }
  })
}

// Check if user can view timetable
async function canViewTimetable(userId: string, timetableId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })

  // HOD can view all timetables
  if (user?.role === "HOD") return true

  // Check if user is in any group assigned to this timetable
  const membership = await prisma.timetableGroup.findFirst({
    where: {
      timetableId,
      group: {
        memberships: {
          some: { userId }
        }
      }
    }
  })

  return !!membership
}

// Check if user can edit timetable
async function canEditTimetable(userId: string, timetableId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })

  // HOD can edit all timetables
  if (user?.role === "HOD") return true

  // Check if user has editor role in any group assigned to this timetable
  const membership = await prisma.groupMembership.findFirst({
    where: {
      userId,
      role: "Editor",
      group: {
        timetables: {
          some: { timetableId }
        }
      }
    }
  })

  // Also check if default role is Editor for any group the user is in
  if (!membership) {
    const defaultEditorMembership = await prisma.groupMembership.findFirst({
      where: {
        userId,
        group: {
          defaultRole: "Editor",
          timetables: {
            some: { timetableId }
          }
        }
      }
    })
    return !!defaultEditorMembership
  }

  return !!membership
}

// Get all timetables (HOD sees all, others see only assigned via groups)
export async function getTimetables() {
  const user = await getCurrentUser()
  if (!user) return []

  if (user.role === "HOD") {
    return prisma.timetable.findMany({
      include: {
        createdBy: { select: { id: true, name: true } },
        slots: {
          include: {
            subject: { select: { id: true, name: true, shortName: true } },
            slotType: { select: { id: true, name: true } },
            room: { select: { id: true, number: true } },
            faculty: { select: { id: true, name: true } },
            batch: { select: { id: true, name: true } }
          },
          orderBy: [{ day: "asc" }, { startTime: "asc" }]
        },
        groups: {
          include: {
            group: { select: { id: true, title: true, defaultRole: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })
  }

  // For non-HOD users, get active timetables they have access to through groups
  return prisma.timetable.findMany({
    where: {
      isActive: true,  // Only show active timetables to non-HOD
      groups: {
        some: {
          group: {
            memberships: {
              some: { userId: user.id }
            }
          }
        }
      }
    },
    include: {
      createdBy: { select: { id: true, name: true } },
      slots: {
        include: {
          subject: { select: { id: true, name: true, shortName: true } },
          slotType: { select: { id: true, name: true } },
          room: { select: { id: true, number: true } },
          faculty: { select: { id: true, name: true } },
          batch: { select: { id: true, name: true } }
        },
        orderBy: [{ day: "asc" }, { startTime: "asc" }]
      },
      groups: {
        include: {
          group: { select: { id: true, title: true, defaultRole: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })
}

// Get single timetable by ID
export async function getTimetable(id: string) {
  const user = await getCurrentUser()
  if (!user) return null

  const canView = await canViewTimetable(user.id, id)
  if (!canView) return null

  return prisma.timetable.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true } },
      slots: {
        include: {
          subject: { select: { id: true, name: true, shortName: true } },
          slotType: { select: { id: true, name: true } },
          room: { select: { id: true, number: true } },
          faculty: { select: { id: true, name: true } },
          batch: { select: { id: true, name: true } }
        },
        orderBy: [{ day: "asc" }, { startTime: "asc" }]
      },
      groups: {
        include: {
          group: { select: { id: true, title: true, defaultRole: true } }
        }
      }
    }
  })
}

// Create timetable (HOD only)
export async function createTimetable(data: { name: string; description?: string }) {
  const user = await getCurrentUser()
  if (!user || user.role !== "HOD") {
    return { error: "Only HOD can create timetables" }
  }

  const trimmedName = data.name.trim()
  if (!trimmedName) {
    return { error: "Timetable name is required" }
  }

  if (trimmedName.length > 100) {
    return { error: "Timetable name must be 100 characters or less" }
  }

  try {
    const timetable = await prisma.timetable.create({
      data: {
        name: trimmedName,
        description: data.description?.trim() || null,
        createdById: user.id
      }
    })
    revalidatePath("/dashboard/timetables")
    return { success: true, timetable }
  } catch (error) {
    console.error("Create timetable error:", error)
    return { error: "Failed to create timetable. Please try again." }
  }
}

// Update timetable (HOD or Editor)
export async function updateTimetable(id: string, data: { name: string; description?: string }) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const canEdit = await canEditTimetable(user.id, id)
  if (!canEdit) {
    return { error: "You don't have permission to edit this timetable" }
  }

  const trimmedName = data.name.trim()
  if (!trimmedName) {
    return { error: "Timetable name is required" }
  }

  if (trimmedName.length > 100) {
    return { error: "Timetable name must be 100 characters or less" }
  }

  try {
    await prisma.timetable.update({
      where: { id },
      data: {
        name: trimmedName,
        description: data.description?.trim() || null
      }
    })
    revalidatePath("/dashboard/timetables")
    return { success: true }
  } catch (error) {
    console.error("Update timetable error:", error)
    return { error: "Failed to update timetable. Please try again." }
  }
}

// Delete timetable (HOD only)
export async function deleteTimetable(id: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "HOD") {
    return { error: "Only HOD can delete timetables" }
  }

  try {
    await prisma.timetable.delete({ where: { id } })
    revalidatePath("/dashboard/timetables")
    return { success: true }
  } catch (error) {
    console.error("Delete timetable error:", error)
    return { error: "Failed to delete timetable. Please try again." }
  }
}

// Add slot to timetable
export async function addTimeSlot(timetableId: string, data: TimeSlotData) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const canEdit = await canEditTimetable(user.id, timetableId)
  if (!canEdit) {
    return { error: "You don't have permission to edit this timetable" }
  }

  // Validate time format
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (!timeRegex.test(data.startTime) || !timeRegex.test(data.endTime)) {
    return { error: "Invalid time format. Use HH:MM" }
  }

  // Validate start time is before end time
  if (data.startTime >= data.endTime) {
    return { error: "Start time must be before end time" }
  }

  try {
    await prisma.timeSlot.create({
      data: {
        timetableId,
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        subjectId: data.subjectId || null,
        slotTypeId: data.slotTypeId,
        roomId: data.roomId || null,
        facultyId: data.facultyId || null,
        batchId: data.batchId || null
      }
    })
    revalidatePath("/dashboard/timetables")
    return { success: true }
  } catch (error) {
    console.error("Add time slot error:", error)
    return { error: "Failed to add time slot. Please try again." }
  }
}

// Update time slot
export async function updateTimeSlot(slotId: string, data: TimeSlotData) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  // Get the slot to find its timetable
  const slot = await prisma.timeSlot.findUnique({
    where: { id: slotId },
    select: { timetableId: true }
  })

  if (!slot) return { error: "Slot not found" }

  const canEdit = await canEditTimetable(user.id, slot.timetableId)
  if (!canEdit) {
    return { error: "You don't have permission to edit this timetable" }
  }

  // Validate time format
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (!timeRegex.test(data.startTime) || !timeRegex.test(data.endTime)) {
    return { error: "Invalid time format. Use HH:MM" }
  }

  // Validate start time is before end time
  if (data.startTime >= data.endTime) {
    return { error: "Start time must be before end time" }
  }

  try {
    await prisma.timeSlot.update({
      where: { id: slotId },
      data: {
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        subjectId: data.subjectId || null,
        slotTypeId: data.slotTypeId,
        roomId: data.roomId || null,
        facultyId: data.facultyId || null,
        batchId: data.batchId || null
      }
    })
    revalidatePath("/dashboard/timetables")
    return { success: true }
  } catch (error) {
    console.error("Update time slot error:", error)
    return { error: "Failed to update time slot. Please try again." }
  }
}

// Delete time slot
export async function deleteTimeSlot(slotId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  // Get the slot to find its timetable
  const slot = await prisma.timeSlot.findUnique({
    where: { id: slotId },
    select: { timetableId: true }
  })

  if (!slot) return { error: "Slot not found" }

  const canEdit = await canEditTimetable(user.id, slot.timetableId)
  if (!canEdit) {
    return { error: "You don't have permission to edit this timetable" }
  }

  try {
    await prisma.timeSlot.delete({ where: { id: slotId } })
    revalidatePath("/dashboard/timetables")
    return { success: true }
  } catch (error) {
    console.error("Delete time slot error:", error)
    return { error: "Failed to delete time slot. Please try again." }
  }
}

// Assign group to timetable (HOD only)
export async function assignGroupToTimetable(timetableId: string, groupId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "HOD") {
    return { error: "Only HOD can assign groups to timetables" }
  }

  try {
    await prisma.timetableGroup.create({
      data: { timetableId, groupId }
    })
    revalidatePath("/dashboard/timetables")
    return { success: true }
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "This group is already assigned to this timetable" }
    }
    console.error("Assign group error:", error)
    return { error: "Failed to assign group. Please try again." }
  }
}

// Remove group from timetable (HOD only)
export async function removeGroupFromTimetable(timetableId: string, groupId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "HOD") {
    return { error: "Only HOD can remove groups from timetables" }
  }

  try {
    await prisma.timetableGroup.delete({
      where: {
        timetableId_groupId: { timetableId, groupId }
      }
    })
    revalidatePath("/dashboard/timetables")
    return { success: true }
  } catch (error) {
    console.error("Remove group error:", error)
    return { error: "Failed to remove group. Please try again." }
  }
}

// Get all subjects (for dropdown)
export async function getAllSubjects() {
  return prisma.subject.findMany({
    select: { id: true, name: true, shortName: true },
    orderBy: { name: "asc" }
  })
}

// Get all slot types (for dropdown)
export async function getAllSlotTypes() {
  return prisma.slotType.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  })
}

// Get all rooms (for dropdown)
export async function getAllRooms() {
  return prisma.room.findMany({
    select: { id: true, number: true },
    orderBy: { number: "asc" }
  })
}

// Get all faculty and HOD users (for dropdown)
export async function getAllFaculty() {
  return prisma.user.findMany({
    where: { role: { in: ["Faculty", "HOD"] } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" }
  })
}

// Get all groups (for assigning to timetable)
export async function getAllGroups() {
  const user = await getCurrentUser()
  if (!user || user.role !== "HOD") return []

  return prisma.group.findMany({
    select: { id: true, title: true, defaultRole: true },
    orderBy: { title: "asc" }
  })
}

// Get all batches
export async function getAllBatches() {
  return prisma.batch.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  })
}

// Check if user can edit a specific timetable (for UI)
export async function checkCanEditTimetable(timetableId: string) {
  const user = await getCurrentUser()
  if (!user) return false
  return canEditTimetable(user.id, timetableId)
}

// Toggle timetable active status (HOD only)
export async function toggleTimetableActive(id: string, isActive: boolean) {
  const user = await getCurrentUser()
  if (!user || user.role !== "HOD") {
    return { error: "Only HOD can toggle timetable status" }
  }

  try {
    await prisma.timetable.update({
      where: { id },
      data: { isActive }
    })
    revalidatePath("/dashboard/timetables")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Toggle timetable error:", error)
    return { error: "Failed to toggle timetable status" }
  }
}
