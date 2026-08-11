/**
 * Helpers for treating "HH:MM" slot times as real intervals rather than opaque labels.
 *
 * Availability is computed by subtracting the intervals somebody is booked for from
 * the intervals they could possibly be booked in, so overlapping period definitions
 * (a 08:10-10:00 lab block and a 09:05-10:00 lecture describing the same morning)
 * collapse into one answer instead of being listed side by side.
 */

export type Interval = { start: number; end: number }

/** "09:05" -> 545 (minutes since midnight). Returns null for malformed input. */
export function toMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

/** 545 -> "09:05" */
export function toTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

/** Build an interval from two "HH:MM" strings, discarding malformed or empty ranges. */
export function toInterval(startTime: string, endTime: string): Interval | null {
  const start = toMinutes(startTime)
  const end = toMinutes(endTime)
  if (start === null || end === null || end <= start) return null
  return { start, end }
}

/** Merge overlapping and touching intervals into the smallest equivalent set. */
export function mergeIntervals(intervals: Interval[]): Interval[] {
  if (intervals.length === 0) return []

  const sorted = [...intervals].sort((a, b) => a.start - b.start || a.end - b.end)
  const merged: Interval[] = [{ ...sorted[0] }]

  for (const current of sorted.slice(1)) {
    const last = merged[merged.length - 1]
    if (current.start <= last.end) {
      // Overlapping or adjacent - extend the open interval
      last.end = Math.max(last.end, current.end)
    } else {
      merged.push({ ...current })
    }
  }

  return merged
}

/** Everything in `base` that is not covered by `remove`. Both may be unsorted/overlapping. */
export function subtractIntervals(base: Interval[], remove: Interval[]): Interval[] {
  const busy = mergeIntervals(remove)
  const result: Interval[] = []

  for (const window of mergeIntervals(base)) {
    let cursor = window.start

    for (const taken of busy) {
      if (taken.end <= cursor) continue
      if (taken.start >= window.end) break

      if (taken.start > cursor) {
        result.push({ start: cursor, end: taken.start })
      }
      cursor = Math.max(cursor, taken.end)
      if (cursor >= window.end) break
    }

    if (cursor < window.end) {
      result.push({ start: cursor, end: window.end })
    }
  }

  return result
}

/** True when the two ranges share any time at all (touching endpoints do not count). */
export function intervalsOverlap(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end
}

/**
 * Cut a set of (possibly overlapping) intervals into the smallest non-overlapping
 * pieces that cover the same time, splitting at every boundary that appears.
 *
 *   08:10-10:00, 09:05-10:00, 10:20-12:10, 11:15-12:10
 *     -> 08:10-09:05, 09:05-10:00, 10:20-11:15, 11:15-12:10
 *
 * Gaps between the inputs (lunch, for instance) stay gaps.
 */
export function splitIntoAtoms(intervals: Interval[]): Interval[] {
  const windows = mergeIntervals(intervals)
  if (windows.length === 0) return []

  const boundaries = new Set<number>()
  for (const interval of intervals) {
    boundaries.add(interval.start)
    boundaries.add(interval.end)
  }

  const atoms: Interval[] = []

  for (const window of windows) {
    const cuts = [...boundaries]
      .filter((point) => point > window.start && point < window.end)
      .sort((a, b) => a - b)

    let cursor = window.start
    for (const cut of cuts) {
      atoms.push({ start: cursor, end: cut })
      cursor = cut
    }
    atoms.push({ start: cursor, end: window.end })
  }

  return atoms
}
