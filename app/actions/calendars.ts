"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// Types for calendar data
export type CalendarEventData = {
  id?: string
  title: string
  description?: string
  startDate: string // ISO date string
  endDate?: string // ISO date string
  eventTypeId: string
}

export type CalendarWithEvents = {
  id: string
  name: string
  description: string | null
  createdById: string
  createdBy: { id: string; name: string }
  createdAt: Date
  events: {
    id: string
    title: string
    description: string | null
    startDate: Date
    endDate: Date | null
    eventTypeId: string
    eventType: { id: string; name: string }
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

// Check if user can view calendar
async function canViewCalendar(userId: string, calendarId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })
  
  // HOD can view all calendars
  if (user?.role === "HOD") return true
  
  // Check if user is in any group assigned to this calendar
  const membership = await prisma.calendarGroup.findFirst({
    where: {
      calendarId,
      group: {
        memberships: {
          some: { userId }
        }
      }
    }
  })
  
  return !!membership
}

// Check if user can edit calendar
async function canEditCalendar(userId: string, calendarId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })
  
  // Students cannot edit any calendars - view only
  if (user?.role === "Student") return false
  
  // HOD can edit all calendars
  if (user?.role === "HOD") return true
  
  // Check if user has editor role in any group assigned to this calendar
  const membership = await prisma.groupMembership.findFirst({
    where: {
      userId,
      role: "Editor",
      group: {
        calendars: {
          some: { calendarId }
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
          calendars: {
            some: { calendarId }
          }
        }
      }
    })
    return !!defaultEditorMembership
  }
  
  return !!membership
}

// Get all calendars (HOD sees all, others see only assigned via groups)
export async function getCalendars() {
  const user = await getCurrentUser()
  if (!user) return []
  
  if (user.role === "HOD") {
    return prisma.calendar.findMany({
      include: {
        createdBy: { select: { id: true, name: true } },
        events: {
          include: {
            eventType: { select: { id: true, name: true } }
          },
          orderBy: [{ startDate: "asc" }, { id: "asc" }]
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
  
  // For non-HOD users, get calendars they have access to through groups
  return prisma.calendar.findMany({
    where: {
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
      events: {
        include: {
          eventType: { select: { id: true, name: true } }
        },
        orderBy: [{ startDate: "asc" }, { id: "asc" }]
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

// Get single calendar by ID
export async function getCalendar(id: string) {
  const user = await getCurrentUser()
  if (!user) return null
  
  const canView = await canViewCalendar(user.id, id)
  if (!canView) return null
  
  return prisma.calendar.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true } },
      events: {
        include: {
          eventType: { select: { id: true, name: true } }
        },
        orderBy: [{ startDate: "asc" }, { id: "asc" }]
      },
      groups: {
        include: {
          group: { select: { id: true, title: true, defaultRole: true } }
        }
      }
    }
  })
}

// Create calendar (HOD only)
export async function createCalendar(data: { name: string; description?: string }) {
  const user = await getCurrentUser()
  if (!user || user.role !== "HOD") {
    return { error: "Only HOD can create calendars" }
  }
  
  const trimmedName = data.name.trim()
  if (!trimmedName) {
    return { error: "Calendar name is required" }
  }
  
  if (trimmedName.length > 100) {
    return { error: "Calendar name must be 100 characters or less" }
  }
  
  try {
    const calendar = await prisma.calendar.create({
      data: {
        name: trimmedName,
        description: data.description?.trim() || null,
        createdById: user.id
      }
    })
    revalidatePath("/dashboard/calendars")
    return { success: true, calendar }
  } catch (error) {
    console.error("Create calendar error:", error)
    return { error: "Failed to create calendar. Please try again." }
  }
}

// Update calendar (HOD or Editor)
export async function updateCalendar(id: string, data: { name: string; description?: string }) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }
  
  const canEdit = await canEditCalendar(user.id, id)
  if (!canEdit) {
    return { error: "You don't have permission to edit this calendar" }
  }
  
  const trimmedName = data.name.trim()
  if (!trimmedName) {
    return { error: "Calendar name is required" }
  }
  
  if (trimmedName.length > 100) {
    return { error: "Calendar name must be 100 characters or less" }
  }
  
  try {
    await prisma.calendar.update({
      where: { id },
      data: {
        name: trimmedName,
        description: data.description?.trim() || null
      }
    })
    revalidatePath("/dashboard/calendars")
    return { success: true }
  } catch (error) {
    console.error("Update calendar error:", error)
    return { error: "Failed to update calendar. Please try again." }
  }
}

// Delete calendar (HOD only)
export async function deleteCalendar(id: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "HOD") {
    return { error: "Only HOD can delete calendars" }
  }
  
  try {
    await prisma.calendar.delete({ where: { id } })
    revalidatePath("/dashboard/calendars")
    return { success: true }
  } catch (error) {
    console.error("Delete calendar error:", error)
    return { error: "Failed to delete calendar. Please try again." }
  }
}

// Add event to calendar
export async function addCalendarEvent(calendarId: string, data: CalendarEventData) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }
  
  const canEdit = await canEditCalendar(user.id, calendarId)
  if (!canEdit) {
    return { error: "You don't have permission to edit this calendar" }
  }
  
  const trimmedTitle = data.title.trim()
  if (!trimmedTitle) {
    return { error: "Event title is required" }
  }
  
  if (trimmedTitle.length > 200) {
    return { error: "Event title must be 200 characters or less" }
  }
  
  // Validate dates
  const startDate = new Date(data.startDate)
  if (isNaN(startDate.getTime())) {
    return { error: "Invalid start date" }
  }
  
  let endDate: Date | null = null
  if (data.endDate) {
    endDate = new Date(data.endDate)
    if (isNaN(endDate.getTime())) {
      return { error: "Invalid end date" }
    }
    if (endDate < startDate) {
      return { error: "End date must be after start date" }
    }
  }
  
  try {
    await prisma.calendarEvent.create({
      data: {
        calendarId,
        title: trimmedTitle,
        description: data.description?.trim() || null,
        startDate,
        endDate,
        eventTypeId: data.eventTypeId
      }
    })
    revalidatePath("/dashboard/calendars")
    return { success: true }
  } catch (error) {
    console.error("Add calendar event error:", error)
    return { error: "Failed to add event. Please try again." }
  }
}

// Update calendar event
export async function updateCalendarEvent(eventId: string, data: CalendarEventData) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }
  
  // Get the event to find its calendar
  const event = await prisma.calendarEvent.findUnique({
    where: { id: eventId },
    select: { calendarId: true }
  })
  
  if (!event) return { error: "Event not found" }
  
  const canEdit = await canEditCalendar(user.id, event.calendarId)
  if (!canEdit) {
    return { error: "You don't have permission to edit this calendar" }
  }
  
  const trimmedTitle = data.title.trim()
  if (!trimmedTitle) {
    return { error: "Event title is required" }
  }
  
  if (trimmedTitle.length > 200) {
    return { error: "Event title must be 200 characters or less" }
  }
  
  // Validate dates
  const startDate = new Date(data.startDate)
  if (isNaN(startDate.getTime())) {
    return { error: "Invalid start date" }
  }
  
  let endDate: Date | null = null
  if (data.endDate) {
    endDate = new Date(data.endDate)
    if (isNaN(endDate.getTime())) {
      return { error: "Invalid end date" }
    }
    if (endDate < startDate) {
      return { error: "End date must be after start date" }
    }
  }
  
  try {
    await prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        title: trimmedTitle,
        description: data.description?.trim() || null,
        startDate,
        endDate,
        eventTypeId: data.eventTypeId
      }
    })
    revalidatePath("/dashboard/calendars")
    return { success: true }
  } catch (error) {
    console.error("Update calendar event error:", error)
    return { error: "Failed to update event. Please try again." }
  }
}

// Delete calendar event entirely
export async function deleteCalendarEvent(eventId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }
  
  // Get the event to find its calendar
  const event = await prisma.calendarEvent.findUnique({
    where: { id: eventId },
    select: { calendarId: true }
  })
  
  if (!event) return { error: "Event not found" }
  
  const canEdit = await canEditCalendar(user.id, event.calendarId)
  if (!canEdit) {
    return { error: "You don't have permission to edit this calendar" }
  }
  
  try {
    await prisma.calendarEvent.delete({ where: { id: eventId } })
    revalidatePath("/dashboard/calendars")
    return { success: true }
  } catch (error) {
    console.error("Delete calendar event error:", error)
    return { error: "Failed to delete event. Please try again." }
  }
}

// Remove event from a specific date only (for multi-day events)
export async function removeEventFromDate(eventId: string, dateToRemove: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }
  
  // Get the full event
  const event = await prisma.calendarEvent.findUnique({
    where: { id: eventId },
    include: { calendar: true }
  })
  
  if (!event) return { error: "Event not found" }
  
  const canEdit = await canEditCalendar(user.id, event.calendarId)
  if (!canEdit) {
    return { error: "You don't have permission to edit this calendar" }
  }
  
  // Helper to extract YYYY-MM-DD from a date (using UTC to avoid timezone shifts)
  const getDateString = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }
  
  // Parse the dateToRemove as local date components
  // Format expected: YYYY-MM-DD
  const [removeYear, removeMonth, removeDay] = dateToRemove.split('-').map(Number)
  const removeDateStr = dateToRemove // Already in YYYY-MM-DD format
  
  // Get start and end date strings for comparison
  const startDateStr = getDateString(event.startDate)
  const endDateStr = event.endDate ? getDateString(event.endDate) : startDateStr
  
  // Parse for date arithmetic
  const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number)
  const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number)
  
  // Helper to create a UTC date from year, month, day
  const createUTCDate = (year: number, month: number, day: number): Date => {
    return new Date(Date.UTC(year, month - 1, day))
  }
  
  // Helper to add days to a date string and return new date string
  const addDays = (dateStr: string, days: number): string => {
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(Date.UTC(y, m - 1, d + days))
    return date.toISOString().split('T')[0]
  }
  
  try {
    // Case 1: Single-day event - just delete it
    if (startDateStr === endDateStr) {
      await prisma.calendarEvent.delete({ where: { id: eventId } })
      revalidatePath("/dashboard/calendars")
      return { success: true }
    }
    
    // Case 2: Removing start date - move start date forward
    if (removeDateStr === startDateStr) {
      const newStartDateStr = addDays(startDateStr, 1)
      const [y, m, d] = newStartDateStr.split('-').map(Number)
      await prisma.calendarEvent.update({
        where: { id: eventId },
        data: { startDate: createUTCDate(y, m, d) }
      })
      revalidatePath("/dashboard/calendars")
      return { success: true }
    }
    
    // Case 3: Removing end date - move end date backward
    if (removeDateStr === endDateStr) {
      const newEndDateStr = addDays(endDateStr, -1)
      // If new end date equals start date, set endDate to null (single day)
      if (newEndDateStr === startDateStr) {
        await prisma.calendarEvent.update({
          where: { id: eventId },
          data: { endDate: null }
        })
      } else {
        const [y, m, d] = newEndDateStr.split('-').map(Number)
        await prisma.calendarEvent.update({
          where: { id: eventId },
          data: { endDate: createUTCDate(y, m, d) }
        })
      }
      revalidatePath("/dashboard/calendars")
      return { success: true }
    }
    
    // Case 4: Removing middle date - split into two events
    // Update original event to end the day before removed date
    const newEndForFirstStr = addDays(removeDateStr, -1)
    
    if (newEndForFirstStr === startDateStr) {
      await prisma.calendarEvent.update({
        where: { id: eventId },
        data: { endDate: null }
      })
    } else {
      const [y, m, d] = newEndForFirstStr.split('-').map(Number)
      await prisma.calendarEvent.update({
        where: { id: eventId },
        data: { endDate: createUTCDate(y, m, d) }
      })
    }
    
    // Create new event starting the day after removed date
    const newStartForSecondStr = addDays(removeDateStr, 1)
    const [sy, sm, sd] = newStartForSecondStr.split('-').map(Number)
    
    if (newStartForSecondStr === endDateStr) {
      await prisma.calendarEvent.create({
        data: {
          calendarId: event.calendarId,
          title: event.title,
          description: event.description,
          startDate: createUTCDate(sy, sm, sd),
          endDate: null,
          eventTypeId: event.eventTypeId
        }
      })
    } else {
      const [ey, em, ed] = endDateStr.split('-').map(Number)
      await prisma.calendarEvent.create({
        data: {
          calendarId: event.calendarId,
          title: event.title,
          description: event.description,
          startDate: createUTCDate(sy, sm, sd),
          endDate: createUTCDate(ey, em, ed),
          eventTypeId: event.eventTypeId
        }
      })
    }
    
    revalidatePath("/dashboard/calendars")
    return { success: true }
  } catch (error) {
    console.error("Remove event from date error:", error)
    return { error: "Failed to remove event from date. Please try again." }
  }
}

// Assign group to calendar (HOD only)
export async function assignGroupToCalendar(calendarId: string, groupId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "HOD") {
    return { error: "Only HOD can assign groups to calendars" }
  }
  
  try {
    await prisma.calendarGroup.create({
      data: { calendarId, groupId }
    })
    revalidatePath("/dashboard/calendars")
    return { success: true }
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "This group is already assigned to this calendar" }
    }
    console.error("Assign group error:", error)
    return { error: "Failed to assign group. Please try again." }
  }
}

// Remove group from calendar (HOD only)
export async function removeGroupFromCalendar(calendarId: string, groupId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "HOD") {
    return { error: "Only HOD can remove groups from calendars" }
  }
  
  try {
    await prisma.calendarGroup.delete({
      where: {
        calendarId_groupId: { calendarId, groupId }
      }
    })
    revalidatePath("/dashboard/calendars")
    return { success: true }
  } catch (error) {
    console.error("Remove group error:", error)
    return { error: "Failed to remove group. Please try again." }
  }
}

// Get all groups (for assigning to calendar)
export async function getAllGroupsForCalendar() {
  const user = await getCurrentUser()
  if (!user || user.role !== "HOD") return []
  
  return prisma.group.findMany({
    select: { id: true, title: true, defaultRole: true },
    orderBy: { title: "asc" }
  })
}

// Check if user can edit a specific calendar (for UI)
export async function checkCanEditCalendar(calendarId: string) {
  const user = await getCurrentUser()
  if (!user) return false
  return canEditCalendar(user.id, calendarId)
}
