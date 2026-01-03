import type { DayOfWeek } from "@/app/actions/timetables"

export type TimeSlotForPDF = {
  id: string
  day: DayOfWeek
  startTime: string
  endTime: string
  subject: { id: string; name: string; shortName: string } | null
  slotType: { id: string; name: string }
  room: { id: string; number: string } | null
  faculty: { id: string; name: string } | null
  batch: { id: string; name: string } | null
}

export type TimetableForPDF = {
  id: string
  name: string
  description: string | null
  createdBy: { id: string; name: string }
  createdAt: Date
  slots: TimeSlotForPDF[]
}

export type TimeRange = {
  startTime: string
  endTime: string
}

export type FacultyLegend = {
  abbreviation: string
  fullName: string
}

/**
 * Generate faculty abbreviation from full name
 * "Shafaque Syed" -> "SS"
 * "John" -> "JO"
 */
export function generateFacultyAbbreviation(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  // Single word name - use first 2 letters
  return name.substring(0, 2).toUpperCase()
}

/**
 * Check if a slot type represents a break
 */
export function isBreakSlot(slotTypeName: string): boolean {
  return slotTypeName.toLowerCase().includes("break")
}

/**
 * Extract unique time ranges from all slots
 */
export function extractTimeRanges(slots: TimeSlotForPDF[]): TimeRange[] {
  const timeMap = new Map<string, TimeRange>()
  
  slots.forEach(slot => {
    const key = `${slot.startTime}-${slot.endTime}`
    if (!timeMap.has(key)) {
      timeMap.set(key, {
        startTime: slot.startTime,
        endTime: slot.endTime,
      })
    }
  })
  
  // Sort chronologically
  return Array.from(timeMap.values()).sort((a, b) => {
    return a.startTime.localeCompare(b.startTime)
  })
}

/**
 * Format time from HH:MM to H.MM AM/PM format for display
 */
export function formatTimeForPDF(time: string): string {
  const [hours, minutes] = time.split(":")
  const hour24 = parseInt(hours, 10)
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
  const period = hour24 >= 12 ? "PM" : "AM"
  return `${hour12}.${minutes} ${period}`
}

/**
 * Group slots by day
 */
export function groupSlotsByDay(slots: TimeSlotForPDF[]): Map<DayOfWeek, TimeSlotForPDF[]> {
  const dayMap = new Map<DayOfWeek, TimeSlotForPDF[]>()
  
  const dayOrder: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  
  dayOrder.forEach(day => {
    dayMap.set(day, [])
  })
  
  slots.forEach(slot => {
    const daySlots = dayMap.get(slot.day) || []
    daySlots.push(slot)
    dayMap.set(slot.day, daySlots)
  })
  
  return dayMap
}

/**
 * Get slots for a specific day and time range
 */
export function getSlotsForTime(
  slots: TimeSlotForPDF[],
  day: DayOfWeek,
  timeRange: TimeRange
): TimeSlotForPDF[] {
  return slots.filter(
    slot =>
      slot.day === day &&
      slot.startTime === timeRange.startTime &&
      slot.endTime === timeRange.endTime
  )
}

/**
 * Generate faculty legend from all slots
 */
export function generateFacultyLegend(slots: TimeSlotForPDF[]): FacultyLegend[] {
  const facultyMap = new Map<string, string>()
  
  slots.forEach(slot => {
    if (slot.faculty) {
      const abbreviation = generateFacultyAbbreviation(slot.faculty.name)
      if (!facultyMap.has(abbreviation)) {
        facultyMap.set(abbreviation, slot.faculty.name)
      }
    }
  })
  
  return Array.from(facultyMap.entries())
    .map(([abbreviation, fullName]) => ({ abbreviation, fullName }))
    .sort((a, b) => a.abbreviation.localeCompare(b.abbreviation))
}

/**
 * Format cell content for a slot
 */
export function formatSlotContent(slot: TimeSlotForPDF): string[] {
  const lines: string[] = []
  
  // Primary: Subject or Slot Type
  if (slot.subject) {
    lines.push(slot.subject.shortName || slot.subject.name)
  } else {
    lines.push(slot.slotType.name)
  }
  
  // Secondary: Faculty abbreviation
  if (slot.faculty) {
    const abbreviation = generateFacultyAbbreviation(slot.faculty.name)
    lines.push(`(${abbreviation})`)
  }
  
  // Tertiary: Room number
  if (slot.room) {
    lines.push(slot.room.number)
  }
  
  // Quaternary: Batch name (on separate line, but we'll handle this in the component)
  if (slot.batch) {
    lines.push(slot.batch.name)
  }
  
  return lines
}

/**
 * Format date for footer
 */
export function formatDateForPDF(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

