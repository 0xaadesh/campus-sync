"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// Get current user helper
async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.email) return null
  return prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, email: true, name: true }
  })
}

// Get all event types
export async function getEventTypes() {
  try {
    return await prisma.eventType.findMany({
      orderBy: { name: "asc" },
    })
  } catch (error) {
    console.error("Get event types error:", error)
    return []
  }
}

// Create a new event type (HOD only)
export async function createEventType(prevState: any, formData: FormData) {
  const user = await getCurrentUser()
  if (!user || user.role !== "HOD") {
    return { error: "Only HOD can create event types" }
  }

  const name = formData.get("name") as string
  const description = formData.get("description") as string | null

  // Validation
  if (!name) {
    return { error: "Event type name is required" }
  }

  const trimmedName = name.trim()
  if (!trimmedName) {
    return { error: "Event type name cannot be empty" }
  }

  if (trimmedName.length > 50) {
    return { error: "Event type name must be 50 characters or less" }
  }

  try {
    await prisma.eventType.create({
      data: { 
        name: trimmedName,
        description: description?.trim() || null
      },
    })
    revalidatePath("/dashboard/event-types")
    revalidatePath("/dashboard/calendars")
    return { success: true }
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "Event type name already exists" }
    }
    console.error("Create event type error:", error)
    return { error: "Failed to create event type. Please try again." }
  }
}

// Update an event type (HOD only)
export async function updateEventType(prevState: any, formData: FormData) {
  const user = await getCurrentUser()
  if (!user || user.role !== "HOD") {
    return { error: "Only HOD can update event types" }
  }

  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const description = formData.get("description") as string | null

  // Validation
  if (!id || !name) {
    return { error: "Event type name is required" }
  }

  const trimmedName = name.trim()
  if (!trimmedName) {
    return { error: "Event type name cannot be empty" }
  }

  if (trimmedName.length > 50) {
    return { error: "Event type name must be 50 characters or less" }
  }

  try {
    await prisma.eventType.update({
      where: { id },
      data: { 
        name: trimmedName,
        description: description?.trim() || null
      },
    })
    revalidatePath("/dashboard/event-types")
    revalidatePath("/dashboard/calendars")
    return { success: true }
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "Event type name already exists" }
    }
    if (error.code === "P2025") {
      return { error: "Event type not found" }
    }
    console.error("Update event type error:", error)
    return { error: "Failed to update event type. Please try again." }
  }
}

// Delete an event type (HOD only)
export async function deleteEventType(id: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "HOD") {
    return { error: "Only HOD can delete event types" }
  }

  try {
    // Check if any events are using this type
    const eventsUsingType = await prisma.calendarEvent.count({
      where: { eventTypeId: id }
    })

    if (eventsUsingType > 0) {
      return { error: `Cannot delete: ${eventsUsingType} event(s) are using this type` }
    }

    await prisma.eventType.delete({
      where: { id },
    })
    revalidatePath("/dashboard/event-types")
    revalidatePath("/dashboard/calendars")
    return { success: true }
  } catch (error: any) {
    if (error.code === "P2025") {
      return { error: "Event type not found" }
    }
    console.error("Delete event type error:", error)
    return { error: "Failed to delete event type" }
  }
}
