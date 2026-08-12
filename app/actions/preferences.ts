"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export interface SlotTypeWithPreference {
  id: string
  name: string
  enabled: boolean
}

export interface BatchWithPreference {
  id: string
  name: string
  selected: boolean
}

export interface StudentPreferences {
  slotTypes: SlotTypeWithPreference[]
  batches: BatchWithPreference[]
}

export async function getStudentPreferences(): Promise<StudentPreferences> {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { slotTypes: [], batches: [] }
  }

  const userId = session.user.id

  // Get all slot types
  const allSlotTypes = await prisma.slotType.findMany({
    orderBy: { name: "asc" }
  })

  // Get user's slot type preferences
  const slotTypePrefs = await prisma.slotTypePreference.findMany({
    where: { userId }
  })

  const slotTypePrefMap = new Map(slotTypePrefs.map(p => [p.slotTypeId, p.enabled]))

  // If no preferences exist, all slot types are enabled by default
  const slotTypes: SlotTypeWithPreference[] = allSlotTypes.map(st => ({
    id: st.id,
    name: st.name,
    enabled: slotTypePrefMap.has(st.id) ? slotTypePrefMap.get(st.id)! : true
  }))

  // Get all batches
  const allBatches = await prisma.batch.findMany({
    orderBy: { name: "asc" }
  })

  // Get user's batch preferences
  const batchPrefs = await prisma.batchPreference.findMany({
    where: { userId }
  })

  const batchPrefSet = new Set(batchPrefs.map(p => p.batchId))

  // If no batch preferences exist, no batches are selected (show all)
  // If any batch preferences exist, only show those batches
  const batches: BatchWithPreference[] = allBatches.map(b => ({
    id: b.id,
    name: b.name,
    selected: batchPrefSet.has(b.id)
  }))

  return { slotTypes, batches }
}

export async function updateSlotTypePreference(
  slotTypeId: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" }
  }

  const userId = session.user.id

  try {
    await prisma.slotTypePreference.upsert({
      where: {
        userId_slotTypeId: { userId, slotTypeId }
      },
      update: { enabled },
      create: { userId, slotTypeId, enabled }
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/profile")
    return { success: true }
  } catch (error) {
    console.error("Failed to update slot type preference:", error)
    return { success: false, error: "Failed to update preference" }
  }
}

export async function updateBatchPreferences(
  batchIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" }
  }

  const userId = session.user.id

  try {
    // Delete all existing batch preferences for this user
    await prisma.batchPreference.deleteMany({
      where: { userId }
    })

    // Create new batch preferences
    if (batchIds.length > 0) {
      await prisma.batchPreference.createMany({
        data: batchIds.map(batchId => ({ userId, batchId }))
      })
    }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/profile")
    return { success: true }
  } catch (error) {
    console.error("Failed to update batch preferences:", error)
    return { success: false, error: "Failed to update preferences" }
  }
}

// Get user's active preferences for filtering schedule
export async function getActivePreferences(userId: string): Promise<{
  enabledSlotTypeIds: string[] | null // null means all enabled
  selectedBatchIds: string[] | null // null means all batches
}> {
  // Get slot type preferences
  const slotTypePrefs = await prisma.slotTypePreference.findMany({
    where: { userId }
  })

  // If no preferences set, all are enabled
  let enabledSlotTypeIds: string[] | null = null
  if (slotTypePrefs.length > 0) {
    const allSlotTypes = await prisma.slotType.findMany()
    const prefMap = new Map(slotTypePrefs.map(p => [p.slotTypeId, p.enabled]))
    
    enabledSlotTypeIds = allSlotTypes
      .filter(st => prefMap.has(st.id) ? prefMap.get(st.id) : true)
      .map(st => st.id)
  }

  // Get batch preferences
  const batchPrefs = await prisma.batchPreference.findMany({
    where: { userId }
  })

  // If no batch preferences set, show all batches
  const selectedBatchIds = batchPrefs.length > 0 
    ? batchPrefs.map(p => p.batchId) 
    : null

  return { enabledSlotTypeIds, selectedBatchIds }
}
