"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { GroupRole } from "@prisma/client"
import { nanoid } from "nanoid"

function generateGroupCode(): string {
  return nanoid(8).toUpperCase()
}

export async function createGroup(prevState: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "HOD") {
    return { error: "Unauthorized" }
  }

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const defaultRole = formData.get("defaultRole") as GroupRole

  if (!title?.trim()) {
    return { error: "Group title is required" }
  }

  if (!description?.trim()) {
    return { error: "Group description is required" }
  }

  if (!defaultRole || !["Editor", "Viewer"].includes(defaultRole)) {
    return { error: "Invalid default role" }
  }

  try {
    const group = await prisma.group.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        code: generateGroupCode(),
        defaultRole,
        createdById: session.user.id,
      },
    })

    revalidatePath("/dashboard/groups")
    return { success: true, group }
  } catch (error) {
    console.error("Create group error:", error)
    return { error: "Failed to create group" }
  }
}

export async function updateGroup(prevState: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "HOD") {
    return { error: "Unauthorized" }
  }

  const id = formData.get("id") as string
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const defaultRole = formData.get("defaultRole") as GroupRole

  if (!id) {
    return { error: "Group ID is required" }
  }

  if (!title?.trim()) {
    return { error: "Group title is required" }
  }

  if (!description?.trim()) {
    return { error: "Group description is required" }
  }

  if (!defaultRole || !["Editor", "Viewer"].includes(defaultRole)) {
    return { error: "Invalid default role" }
  }

  try {
    const group = await prisma.group.findUnique({ where: { id } })
    if (!group || group.createdById !== session.user.id) {
      return { error: "Group not found or unauthorized" }
    }

    await prisma.group.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description.trim(),
        defaultRole,
      },
    })

    revalidatePath("/dashboard/groups")
    return { success: true }
  } catch (error) {
    console.error("Update group error:", error)
    return { error: "Failed to update group" }
  }
}

export async function deleteGroup(id: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "HOD") {
    return { error: "Unauthorized" }
  }

  try {
    const group = await prisma.group.findUnique({ where: { id } })
    if (!group || group.createdById !== session.user.id) {
      return { error: "Group not found or unauthorized" }
    }

    await prisma.group.delete({ where: { id } })
    revalidatePath("/dashboard/groups")
    return { success: true }
  } catch (error) {
    console.error("Delete group error:", error)
    return { error: "Failed to delete group" }
  }
}

export async function regenerateGroupCode(groupId: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "HOD") {
    return { error: "Unauthorized" }
  }

  try {
    const group = await prisma.group.findUnique({ where: { id: groupId } })
    if (!group || group.createdById !== session.user.id) {
      return { error: "Group not found or unauthorized" }
    }

    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: { 
        code: generateGroupCode(),
        codeActive: true,
      },
    })

    revalidatePath("/dashboard/groups")
    return { success: true, code: updatedGroup.code }
  } catch (error) {
    console.error("Regenerate code error:", error)
    return { error: "Failed to regenerate code" }
  }
}

export async function toggleGroupCode(groupId: string, active: boolean) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "HOD") {
    return { error: "Unauthorized" }
  }

  try {
    const group = await prisma.group.findUnique({ where: { id: groupId } })
    if (!group || group.createdById !== session.user.id) {
      return { error: "Group not found or unauthorized" }
    }

    await prisma.group.update({
      where: { id: groupId },
      data: { codeActive: active },
    })

    revalidatePath("/dashboard/groups")
    return { success: true }
  } catch (error) {
    console.error("Toggle code error:", error)
    return { error: "Failed to toggle code" }
  }
}

export async function joinGroup(code: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  if (!code?.trim()) {
    return { error: "Group code is required" }
  }

  try {
    const group = await prisma.group.findUnique({
      where: { code: code.trim().toUpperCase() },
    })

    if (!group) {
      return { error: "Invalid group code" }
    }

    if (!group.codeActive) {
      return { error: "This group code is no longer active" }
    }

    // Check if user is the creator
    if (group.createdById === session.user.id) {
      return { error: "You are the creator of this group" }
    }

    // Check if already a member
    const existingMembership = await prisma.groupMembership.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: session.user.id,
        },
      },
    })

    if (existingMembership) {
      return { error: "You are already a member of this group" }
    }

    // Students are always viewers, faculty can have the group's default role
    const userDetails = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    const memberRole = userDetails?.role === "Student" ? "Viewer" : group.defaultRole

    await prisma.groupMembership.create({
      data: {
        groupId: group.id,
        userId: session.user.id,
        role: memberRole,
      },
    })

    revalidatePath("/dashboard/groups")
    return { success: true, groupTitle: group.title }
  } catch (error) {
    console.error("Join group error:", error)
    return { error: "Failed to join group" }
  }
}

export async function leaveGroup(groupId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  try {
    const membership = await prisma.groupMembership.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: session.user.id,
        },
      },
    })

    if (!membership) {
      return { error: "You are not a member of this group" }
    }

    await prisma.groupMembership.delete({
      where: { id: membership.id },
    })

    revalidatePath("/dashboard/groups")
    return { success: true }
  } catch (error) {
    console.error("Leave group error:", error)
    return { error: "Failed to leave group" }
  }
}

export async function updateMemberRole(membershipId: string, role: GroupRole) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "HOD") {
    return { error: "Unauthorized" }
  }

  if (!["Editor", "Viewer"].includes(role)) {
    return { error: "Invalid role" }
  }

  try {
    const membership = await prisma.groupMembership.findUnique({
      where: { id: membershipId },
      include: { group: true, user: { select: { role: true } } },
    })

    if (!membership || membership.group.createdById !== session.user.id) {
      return { error: "Membership not found or unauthorized" }
    }

    // Students can only be Viewers - cannot be given Editor role
    if (membership.user.role === "Student" && role === "Editor") {
      return { error: "Students can only have Viewer role" }
    }

    await prisma.groupMembership.update({
      where: { id: membershipId },
      data: { role },
    })

    revalidatePath("/dashboard/groups")
    return { success: true }
  } catch (error) {
    console.error("Update member role error:", error)
    return { error: "Failed to update role" }
  }
}

export async function removeMember(membershipId: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "HOD") {
    return { error: "Unauthorized" }
  }

  try {
    const membership = await prisma.groupMembership.findUnique({
      where: { id: membershipId },
      include: { group: true },
    })

    if (!membership || membership.group.createdById !== session.user.id) {
      return { error: "Membership not found or unauthorized" }
    }

    await prisma.groupMembership.delete({
      where: { id: membershipId },
    })

    revalidatePath("/dashboard/groups")
    return { success: true }
  } catch (error) {
    console.error("Remove member error:", error)
    return { error: "Failed to remove member" }
  }
}

export async function getGroups() {
  const session = await auth()
  if (!session?.user?.id) {
    return []
  }

  try {
    if (session.user.role === "HOD") {
      // HOD sees groups they created
      return await prisma.group.findMany({
        where: { createdById: session.user.id },
        include: {
          _count: { select: { memberships: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    } else {
      // Others see groups they're members of
      const memberships = await prisma.groupMembership.findMany({
        where: { userId: session.user.id },
        include: {
          group: {
            include: {
              createdBy: { select: { name: true } },
            },
          },
        },
        orderBy: { joinedAt: "desc" },
      })
      return memberships.map((m) => ({
        ...m.group,
        memberRole: m.role,
        membershipId: m.id,
      }))
    }
  } catch (error) {
    console.error("Get groups error:", error)
    return []
  }
}

export async function getGroupMembers(groupId: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "HOD") {
    return []
  }

  try {
    const group = await prisma.group.findUnique({ where: { id: groupId } })
    if (!group || group.createdById !== session.user.id) {
      return []
    }

    return await prisma.groupMembership.findMany({
      where: { groupId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { joinedAt: "desc" },
    })
  } catch (error) {
    console.error("Get group members error:", error)
    return []
  }
}

export async function getGroupById(groupId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  try {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { memberships: true } },
      },
    })

    if (!group) return null

    // HOD can see their own groups
    if (session.user.role === "HOD" && group.createdById === session.user.id) {
      return group
    }

    // Others can only see groups they're members of
    const membership = await prisma.groupMembership.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: session.user.id,
        },
      },
    })

    if (membership) {
      return { ...group, memberRole: membership.role, membershipId: membership.id }
    }

    return null
  } catch (error) {
    console.error("Get group by id error:", error)
    return null
  }
}
