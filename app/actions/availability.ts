"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday"

export interface SlotInfo {
  id: string
  startTime: string
  endTime: string
  slotTypeName: string
  day: DayOfWeek
  timetableName: string
  roomNumber: string | null
  subjectShortName: string | null
  subjectName: string | null
  batchName: string | null
}

export interface FacultyInfo {
  id: string
  name: string
  email: string
  availability: "Active" | "Away" | "Busy"
  status: string | null
}

export interface RoomInfo {
  id: string
  number: string
}

export interface FacultyWithSlots extends FacultyInfo {
  occupiedSlots: SlotInfo[]
  freeSlots: SlotInfo[]
}

export interface RoomWithSlots extends RoomInfo {
  occupiedSlots: SlotInfo[]
  freeSlots: SlotInfo[]
}

export interface SlotWithFreeFaculty {
  day: DayOfWeek
  startTime: string
  endTime: string
  slotTypeName: string
  freeFaculty: FacultyInfo[]
  busyFaculty: FacultyInfo[]
}

export interface SlotWithFreeRooms {
  day: DayOfWeek
  startTime: string
  endTime: string
  slotTypeName: string
  freeRooms: RoomInfo[]
  occupiedRooms: RoomInfo[]
}

const DAYS_ORDER: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

function sortByDayAndTime<T extends { day: DayOfWeek; startTime: string }>(items: T[]): T[] {
  return items.sort((a, b) => {
    const dayDiff = DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day)
    if (dayDiff !== 0) return dayDiff
    return a.startTime.localeCompare(b.startTime)
  })
}

export async function getFacultyAvailability(): Promise<{
  facultyWise: FacultyWithSlots[]
  slotWise: SlotWithFreeFaculty[]
}> {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  // Get all faculty and HOD users
  const allFaculty = await prisma.user.findMany({
    where: {
      role: { in: ["Faculty", "HOD"] }
    },
    select: {
      id: true,
      name: true,
      email: true,
      availability: true,
      status: true,
    },
    orderBy: { name: "asc" }
  })

  // Get all time slots with faculty assignments (from active timetables only)
  const allSlots = await prisma.timeSlot.findMany({
    where: {
      slotType: { name: { not: "Break" } },
      timetable: { isActive: true }
    },
    include: {
      timetable: { select: { name: true } },
      slotType: { select: { name: true } },
      faculty: { select: { id: true, name: true, email: true, availability: true, status: true } },
      room: { select: { number: true } },
      subject: { select: { name: true, shortName: true } },
      batch: { select: { name: true } }
    }
  })

  // Get unique slot definitions (day + time combinations from active timetables)
  const uniqueSlotDefs = await prisma.timeSlot.findMany({
    where: {
      slotType: { name: { not: "Break" } },
      timetable: { isActive: true }
    },
    select: {
      day: true,
      startTime: true,
      endTime: true,
      slotType: { select: { name: true } }
    },
    distinct: ["day", "startTime", "endTime"]
  })

  // Faculty-wise: show each faculty with their occupied slots and free slots
  const facultyWise: FacultyWithSlots[] = allFaculty.map(faculty => {
    const occupiedSlots = allSlots
      .filter(slot => slot.facultyId === faculty.id)
      .map(slot => ({
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        slotTypeName: slot.slotType.name,
        day: slot.day as DayOfWeek,
        timetableName: slot.timetable.name,
        roomNumber: slot.room?.number || null,
        subjectShortName: slot.subject?.shortName || null,
        subjectName: slot.subject?.name || null,
        batchName: slot.batch?.name || null
      }))

    // Calculate free slots for this faculty
    const occupiedSlotKeys = new Set(
      occupiedSlots.map(s => `${s.day}-${s.startTime}-${s.endTime}`)
    )

    const freeSlots = uniqueSlotDefs
      .filter(slotDef => !occupiedSlotKeys.has(`${slotDef.day}-${slotDef.startTime}-${slotDef.endTime}`))
      .map(slotDef => ({
        id: `free-${slotDef.day}-${slotDef.startTime}`,
        startTime: slotDef.startTime,
        endTime: slotDef.endTime,
        slotTypeName: slotDef.slotType.name,
        day: slotDef.day as DayOfWeek,
        timetableName: "",
        roomNumber: null,
        subjectShortName: null,
        subjectName: null,
        batchName: null
      }))

    return {
      id: faculty.id,
      name: faculty.name,
      email: faculty.email,
      availability: faculty.availability as "Active" | "Away" | "Busy",
      status: faculty.status,
      occupiedSlots: sortByDayAndTime(occupiedSlots),
      freeSlots: sortByDayAndTime(freeSlots)
    }
  })

  // Slot-wise: for each unique slot, show which faculty are free
  const slotWise: SlotWithFreeFaculty[] = sortByDayAndTime(uniqueSlotDefs.map(slotDef => {
    // Find faculty who are occupied during this slot
    const occupiedFacultyIds = allSlots
      .filter(s =>
        s.day === slotDef.day &&
        s.startTime === slotDef.startTime &&
        s.endTime === slotDef.endTime
      )
      .map(s => s.facultyId)
      .filter((id): id is string => id !== null)

    const occupiedFacultyIdsSet = new Set(occupiedFacultyIds)

    const freeFaculty = allFaculty
      .filter(f => !occupiedFacultyIdsSet.has(f.id))
      .map(f => ({
        id: f.id,
        name: f.name,
        email: f.email,
        availability: f.availability as "Active" | "Away" | "Busy",
        status: f.status
      }))

    const busyFaculty = allFaculty
      .filter(f => occupiedFacultyIdsSet.has(f.id))
      .map(f => ({
        id: f.id,
        name: f.name,
        email: f.email,
        availability: f.availability as "Active" | "Away" | "Busy",
        status: f.status
      }))

    return {
      day: slotDef.day as DayOfWeek,
      startTime: slotDef.startTime,
      endTime: slotDef.endTime,
      slotTypeName: slotDef.slotType.name,
      freeFaculty,
      busyFaculty
    }
  }))

  return { facultyWise, slotWise }
}

export async function getRoomAvailability(): Promise<{
  roomWise: RoomWithSlots[]
  slotWise: SlotWithFreeRooms[]
}> {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  // Get all rooms
  const allRooms = await prisma.room.findMany({
    select: {
      id: true,
      number: true,
    },
    orderBy: { number: "asc" }
  })

  // Get all time slots with room assignments (from active timetables only)
  const allSlots = await prisma.timeSlot.findMany({
    where: {
      roomId: { not: null },
      slotType: { name: { not: "Break" } },
      timetable: { isActive: true }
    },
    include: {
      timetable: { select: { name: true } },
      slotType: { select: { name: true } },
      room: { select: { id: true, number: true } },
      subject: { select: { name: true, shortName: true } },
      batch: { select: { name: true } }
    }
  })

  // Get unique slot definitions (day + time combinations from active timetables)
  const uniqueSlotDefs = await prisma.timeSlot.findMany({
    where: {
      slotType: { name: { not: "Break" } },
      timetable: { isActive: true }
    },
    select: {
      day: true,
      startTime: true,
      endTime: true,
      slotType: { select: { name: true } }
    },
    distinct: ["day", "startTime", "endTime"]
  })

  // Room-wise: show each room with its occupied slots and free slots
  const roomWise: RoomWithSlots[] = allRooms.map(room => {
    const occupiedSlots = allSlots
      .filter(slot => slot.roomId === room.id)
      .map(slot => ({
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        slotTypeName: slot.slotType.name,
        day: slot.day as DayOfWeek,
        timetableName: slot.timetable.name,
        roomNumber: slot.room?.number || null,
        subjectShortName: slot.subject?.shortName || null,
        subjectName: slot.subject?.name || null,
        batchName: slot.batch?.name || null
      }))

    // Calculate free slots for this room
    const occupiedSlotKeys = new Set(
      occupiedSlots.map(s => `${s.day}-${s.startTime}-${s.endTime}`)
    )

    const freeSlots = uniqueSlotDefs
      .filter(slotDef => !occupiedSlotKeys.has(`${slotDef.day}-${slotDef.startTime}-${slotDef.endTime}`))
      .map(slotDef => ({
        id: `free-${slotDef.day}-${slotDef.startTime}`,
        startTime: slotDef.startTime,
        endTime: slotDef.endTime,
        slotTypeName: slotDef.slotType.name,
        day: slotDef.day as DayOfWeek,
        timetableName: "",
        roomNumber: null,
        subjectShortName: null,
        subjectName: null,
        batchName: null
      }))

    return {
      id: room.id,
      number: room.number,
      occupiedSlots: sortByDayAndTime(occupiedSlots),
      freeSlots: sortByDayAndTime(freeSlots)
    }
  })

  // Slot-wise: for each unique slot, show which rooms are free
  const slotWise: SlotWithFreeRooms[] = sortByDayAndTime(uniqueSlotDefs.map(slotDef => {
    // Find rooms that are occupied during this slot
    const occupiedRoomIds = allSlots
      .filter(s =>
        s.day === slotDef.day &&
        s.startTime === slotDef.startTime &&
        s.endTime === slotDef.endTime
      )
      .map(s => s.roomId)
      .filter((id): id is string => id !== null)

    const occupiedRoomIdsSet = new Set(occupiedRoomIds)

    const freeRooms = allRooms
      .filter(r => !occupiedRoomIdsSet.has(r.id))
      .map(r => ({
        id: r.id,
        number: r.number
      }))

    const occupiedRooms = allRooms
      .filter(r => occupiedRoomIdsSet.has(r.id))
      .map(r => ({
        id: r.id,
        number: r.number
      }))

    return {
      day: slotDef.day as DayOfWeek,
      startTime: slotDef.startTime,
      endTime: slotDef.endTime,
      slotTypeName: slotDef.slotType.name,
      freeRooms,
      occupiedRooms
    }
  }))

  return { roomWise, slotWise }
}
