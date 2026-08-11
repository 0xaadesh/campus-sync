/**
 * Faculty names are stored with their honorific ("Dr. Kiran B. Deshpande"), which is
 * how they should be displayed but not how they should be sorted or abbreviated -
 * sorting on the raw string groups every Dr. together, and the first character is
 * "D" or "M" for almost everybody.
 */

const HONORIFICS = new Set(["dr", "mr", "ms", "mrs", "miss", "prof", "shri", "smt"])

/** "Dr. Kiran B. Deshpande" -> "Kiran B. Deshpande" */
export function stripHonorific(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length > 1 && HONORIFICS.has(parts[0].replace(/\.$/, "").toLowerCase())) {
    return parts.slice(1).join(" ")
  }
  return name.trim()
}

/** Surname first, so the list reads alphabetically by family name. */
export function nameSortKey(name: string): string {
  const parts = stripHonorific(name).split(/\s+/).filter(Boolean)
  if (parts.length === 0) return name.toLowerCase()
  const surname = parts[parts.length - 1]
  return `${surname} ${parts.slice(0, -1).join(" ")}`.toLowerCase()
}

/** "Dr. Kiran B. Deshpande" -> "KD", "Ms. Sujata Oak" -> "SO" */
export function nameInitials(name: string): string {
  const parts = stripHonorific(name).split(/\s+/).filter(Boolean)
  if (parts.length === 0) return name.charAt(0).toUpperCase()
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function compareByName(a: { name: string }, b: { name: string }): number {
  return nameSortKey(a.name).localeCompare(nameSortKey(b.name))
}
