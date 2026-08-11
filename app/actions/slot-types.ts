"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createSlotType(prevState: any, formData: FormData) {
  const name = formData.get("name") as string
  const isBreak = formData.get("isBreak") === "true"
  // A break never carries a subject, room or faculty, so nothing can be required for it
  const requiresSubject = !isBreak && formData.get("requiresSubject") === "true"
  const requiresRoom = !isBreak && formData.get("requiresRoom") === "true"
  const requiresFaculty = !isBreak && formData.get("requiresFaculty") === "true"

  // Validation
  if (!name) {
    return { error: "Slot type name is required" }
  }

  const trimmedName = name.trim()
  if (!trimmedName) {
    return { error: "Slot type name cannot be empty" }
  }

  if (trimmedName.length > 50) {
    return { error: "Slot type name must be 50 characters or less" }
  }

  try {
    await prisma.slotType.create({
      data: { name: trimmedName, isBreak, requiresSubject, requiresRoom, requiresFaculty },
    })
    revalidatePath("/dashboard/slot-types")
    return { success: true }
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "Slot type name already exists" }
    }
    if (error.code === "P2003") {
      return { error: "Invalid data provided" }
    }
    console.error("Create slot type error:", error)
    return { error: "Failed to create slot type. Please try again." }
  }
}

export async function updateSlotType(prevState: any, formData: FormData) {
  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const isBreak = formData.get("isBreak") === "true"
  // A break never carries a subject, room or faculty, so nothing can be required for it
  const requiresSubject = !isBreak && formData.get("requiresSubject") === "true"
  const requiresRoom = !isBreak && formData.get("requiresRoom") === "true"
  const requiresFaculty = !isBreak && formData.get("requiresFaculty") === "true"

  // Validation
  if (!id || !name) {
    return { error: "Slot type name is required" }
  }

  const trimmedName = name.trim()
  if (!trimmedName) {
    return { error: "Slot type name cannot be empty" }
  }

  if (trimmedName.length > 50) {
    return { error: "Slot type name must be 50 characters or less" }
  }

  try {
    await prisma.slotType.update({
      where: { id },
      data: { name: trimmedName, isBreak, requiresSubject, requiresRoom, requiresFaculty },
    })
    revalidatePath("/dashboard/slot-types")
    return { success: true }
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "Slot type name already exists" }
    }
    if (error.code === "P2025") {
      return { error: "Slot type not found" }
    }
    console.error("Update slot type error:", error)
    return { error: "Failed to update slot type. Please try again." }
  }
}

export async function deleteSlotType(id: string) {
  try {
    await prisma.slotType.delete({
      where: { id },
    })
    revalidatePath("/dashboard/slot-types")
    return { success: true }
  } catch (error) {
    console.error("Delete slot type error:", error)
    return { error: "Failed to delete slot type" }
  }
}

export async function getSlotTypes() {
  try {
    return await prisma.slotType.findMany({
      orderBy: { createdAt: "desc" },
    })
  } catch (error) {
    console.error("Get slot types error:", error)
    return []
  }
}

