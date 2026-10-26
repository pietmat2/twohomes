import { parseISO } from 'date-fns'

/**
 * Only the formatting that carries no language. Anything that names a day, a
 * month or a quantity lives in the i18n hook, where it can see the catalogue
 * and the date-fns locale.
 */

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
