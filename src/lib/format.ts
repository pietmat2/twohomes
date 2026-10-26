import { format, isThisYear, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns'

export function parseDay(iso: string): Date {
  return parseISO(iso)
}

/** "Today", "Tomorrow", otherwise a short readable date. */
export function friendlyDay(iso: string): string {
  const date = parseISO(iso)
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, isThisYear(date) ? 'EEE d MMM' : 'd MMM yyyy')
}

export function longDay(iso: string): string {
  const date = parseISO(iso)
  return format(date, isThisYear(date) ? 'EEEE d MMMM' : 'EEEE d MMMM yyyy')
}

export function shortDay(iso: string): string {
  return format(parseISO(iso), 'd MMM')
}

export function monthTitle(date: Date): string {
  return format(date, 'MMMM yyyy')
}

/** Turn "16:00" into something readable without assuming a locale clock. */
export function prettyTime(time?: string): string {
  if (!time) return ''
  const [h, m] = time.split(':')
  if (h === undefined || m === undefined) return time
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function ageFrom(birthdate?: string): number | null {
  if (!birthdate) return null
  const born = parseISO(birthdate)
  if (Number.isNaN(born.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - born.getFullYear()
  const beforeBirthday =
    now.getMonth() < born.getMonth() ||
    (now.getMonth() === born.getMonth() && now.getDate() < born.getDate())
  if (beforeBirthday) age -= 1
  return age
}

export function pluralise(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}
