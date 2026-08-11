"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { compareByName } from "@/lib/person-name"
import {
  mergeIntervals,
  subtractIntervals,
  intervalsOverlap,
  splitIntoAtoms,
  toInterval,
  toTimeString,
  type Interval
} from "@/lib/time-intervals"

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
  /** Whether this person teaches any slot in an active timetable */
  hasScheduledSlots: boolean
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


type SlotDef = { day: string; startTime: string; endTime: string }


/**
 * Break the day into the smallest non-overlapping periods implied by all the
 * period definitions, so a 08:10-10:00 lab block and the 09:05-10:00 lecture
 * inside it become one readable sequence instead of two overlapping rows.
 */
function buildAtomicSlots(slotDefs: SlotDef[]): { day: DayOfWeek; startTime: string; endTime: string }[] {
  const byDay = new Map<DayOfWeek, Interval[]>()

  for (const def of slotDefs) {
    const interval = toInterval(def.startTime, def.endTime)
    if (!interval) continue
    const day = def.day as DayOfWeek
    const existing = byDay.get(day)
    if (existing) {
      existing.push(interval)
    } else {
      byDay.set(day, [interval])
    }
  }

  const atoms: { day: DayOfWeek; startTime: string; endTime: string }[] = []
  for (const [day, intervals] of byDay) {
    for (const atom of splitIntoAtoms(intervals)) {
      atoms.push({ day, startTime: toTimeString(atom.start), endTime: toTimeString(atom.end) })
    }
  }

  return atoms
}

/** Someone who set themselves Away or Busy should not head up a list of free faculty. */
const AVAILABILITY_RANK: Record<"Active" | "Away" | "Busy", number> = {
  Active: 0,
  Busy: 1,
  Away: 2
}

function sortFaculty(faculty: FacultyInfo[]): FacultyInfo[] {
  return [...faculty].sort((a, b) => {
    const rank = AVAILABILITY_RANK[a.availability] - AVAILABILITY_RANK[b.availability]
    if (rank !== 0) return rank
    return compareByName(a, b)
  })
}
/**
 * The teachable window of each day: every non-break period definition, merged.
 * Overlapping definitions from different timetables (a 2-period lab block and the
 * single lectures covering the same time) collapse into one continuous window, and
 * breaks stay excluded because break slots are filtered out of the query.
 */
function buildDayWindows(slotDefs: SlotDef[]): Map<DayOfWeek, Interval[]> {
  const byDay = new Map<DayOfWeek, Interval[]>()

  for (const def of slotDefs) {
    const interval = toInterval(def.startTime, def.endTime)
    if (!interval) continue
    const day = def.day as DayOfWeek
    const existing = byDay.get(day)
    if (existing) {
      existing.push(interval)
    } else {
      byDay.set(day, [interval])
    }
  }

  for (const [day, intervals] of byDay) {
    byDay.set(day, mergeIntervals(intervals))
  }

  return byDay
}

/**
 * Free time = the day's teachable window minus everything this person or room is
 * booked for. Returns contiguous blocks, so a booking never leaves an overlapping
 * period behind still claiming to be free.
 */
function computeFreeSlots(
  dayWindows: Map<DayOfWeek, Interval[]>,
  occupiedSlots: { day: DayOfWeek; startTime: string; endTime: string }[]
): SlotInfo[] {
  const busyByDay = new Map<DayOfWeek, Interval[]>()
  for (const slot of occupiedSlots) {
    const interval = toInterval(slot.startTime, slot.endTime)
    if (!interval) continue
    const existing = busyByDay.get(slot.day)
    if (existing) {
      existing.push(interval)
    } else {
      busyByDay.set(slot.day, [interval])
    }
  }

  const free: SlotInfo[] = []

  for (const [day, windows] of dayWindows) {
    for (const gap of subtractIntervals(windows, busyByDay.get(day) ?? [])) {
      const startTime = toTimeString(gap.start)
      const endTime = toTimeString(gap.end)
      free.push({
        id: `free-${day}-${startTime}-${endTime}`,
        startTime,
        endTime,
        slotTypeName: "",
        day,
        timetableName: "",
        roomNumber: null,
        subjectShortName: null,
        subjectName: null,
        batchName: null
      })
    }
  }

  return free
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
  })

  // Sorted by surname - the stored name carries an honorific, so ordering on the
  // raw string would group every "Dr." together instead of sorting alphabetically
  allFaculty.sort(compareByName)

  // Get all time slots with faculty assignments (from active timetables only)
  const allSlots = await prisma.timeSlot.findMany({
    where: {
      slotType: { isBreak: false },
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
      slotType: { isBreak: false },
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

  // Merge every period definition into the teachable window of each day
  const dayWindows = buildDayWindows(uniqueSlotDefs)

  // Faculty who appear in at least one active timetable - used to let the UI narrow
  // a 35-name list down to people who actually teach this term
  const teachingFacultyIds = new Set(
    allSlots.map(s => s.facultyId).filter((id): id is string => id !== null)
  )

  const facultyInfos: FacultyInfo[] = allFaculty.map(f => ({
    id: f.id,
    name: f.name,
    email: f.email,
    availability: f.availability as "Active" | "Away" | "Busy",
    status: f.status,
    hasScheduledSlots: teachingFacultyIds.has(f.id)
  }))

  // Faculty-wise: show each faculty with their occupied slots and free slots
  const facultyWise: FacultyWithSlots[] = facultyInfos.map(faculty => {
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
    const freeSlots = computeFreeSlots(dayWindows, occupiedSlots)

    return {
      ...faculty,
      occupiedSlots: sortByDayAndTime(occupiedSlots),
      freeSlots: sortByDayAndTime(freeSlots)
    }
  })
  // Slot-wise: for each atomic period, show which faculty are free
  const slotWise: SlotWithFreeFaculty[] = sortByDayAndTime(buildAtomicSlots(uniqueSlotDefs).map(slotDef => {
    // Anyone whose booking overlaps this period is busy for it, even when the
    // booking was defined on a different (longer or shorter) period grid
    const defInterval = toInterval(slotDef.startTime, slotDef.endTime)
    const occupiedFacultyIds = allSlots
      .filter(s => {
        if (s.day !== slotDef.day || !defInterval) return false
        const slotInterval = toInterval(s.startTime, s.endTime)
        return slotInterval !== null && intervalsOverlap(defInterval, slotInterval)
      })
      .map(s => s.facultyId)
      .filter((id): id is string => id !== null)

    const occupiedFacultyIdsSet = new Set(occupiedFacultyIds)

    return {
      day: slotDef.day,
      startTime: slotDef.startTime,
      endTime: slotDef.endTime,
      slotTypeName: "",
      freeFaculty: sortFaculty(facultyInfos.filter(f => !occupiedFacultyIdsSet.has(f.id))),
      busyFaculty: sortFaculty(facultyInfos.filter(f => occupiedFacultyIdsSet.has(f.id)))
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
      slotType: { isBreak: false },
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
      slotType: { isBreak: false },
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

  // Merge every period definition into the teachable window of each day
  const dayWindows = buildDayWindows(uniqueSlotDefs)

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
    const freeSlots = computeFreeSlots(dayWindows, occupiedSlots)

    return {
      id: room.id,
      number: room.number,
      occupiedSlots: sortByDayAndTime(occupiedSlots),
      freeSlots: sortByDayAndTime(freeSlots)
    }
  })

  // Slot-wise: for each unique slot, show which rooms are free
  const slotWise: SlotWithFreeRooms[] = sortByDayAndTime(buildAtomicSlots(uniqueSlotDefs).map(slotDef => {
    // A room is taken if any booking overlaps this period, whatever grid it came from
    const defInterval = toInterval(slotDef.startTime, slotDef.endTime)
    const occupiedRoomIds = allSlots
      .filter(s => {
        if (s.day !== slotDef.day || !defInterval) return false
        const slotInterval = toInterval(s.startTime, s.endTime)
        return slotInterval !== null && intervalsOverlap(defInterval, slotInterval)
      })
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
      day: slotDef.day,
      startTime: slotDef.startTime,
      endTime: slotDef.endTime,
      slotTypeName: "",
      freeRooms,
      occupiedRooms
    }
  }))

  return { roomWise, slotWise }
}
