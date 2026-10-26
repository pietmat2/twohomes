import { parseISO } from 'date-fns'
import type { DayAssignment } from '../lib/schedule'
import type { ParentId } from '../lib/types'
import { cx, homeStyles } from './ui'

export interface Stay {
  parent: ParentId
  days: DayAssignment[]
}

/**
 * Collapse a run of days into the stays a parent would actually name: "I have
 * them Monday and Tuesday, then he has the long weekend."
 */
export function toStays(days: DayAssignment[]): Stay[] {
  const stays: Stay[] = []
  for (const day of days) {
    const current = stays[stays.length - 1]
    if (current && current.parent === day.parent) current.days.push(day)
    else stays.push({ parent: day.parent, days: [day] })
  }
  return stays
}

const dayNumber = (iso: string) => parseISO(iso).getDate()

/**
 * The shape of the schedule, not a row of identical boxes: a long block is a
 * long stay. Week-on/week-off reads as two bars, 2-2-3 as a stutter.
 *
 * Each block is labelled once, with the dates the stay spans — a fortnight on
 * a 320px phone leaves about 19px per day, which is far too little for a
 * numeral per day, and labelling the stay is truer to the idea anyway.
 */
export function Ribbon({
  days,
  names,
  todayIso,
  animate = true,
}: {
  days: DayAssignment[]
  names: Record<ParentId, string>
  todayIso?: string
  animate?: boolean
}) {
  const stays = toStays(days)

  return (
    <div className="flex gap-1" role="list">
      {stays.map((stay, index) => {
        const holdsToday = todayIso ? stay.days.some((d) => d.date === todayIso) : false
        const first = dayNumber(stay.days[0].date)
        const last = dayNumber(stay.days[stay.days.length - 1].date)
        const label = stay.days.length === 1 ? `${first}` : `${first}–${last}`

        return (
          <div
            key={stay.days[0].date}
            role="listitem"
            style={{
              flexGrow: stay.days.length,
              flexBasis: 0,
              animationDelay: animate ? `${index * 55}ms` : undefined,
            }}
            className={cx(
              'min-w-0 rounded-stay px-1 py-2',
              homeStyles[stay.parent].bg,
              animate && 'animate-stay',
              holdsToday && 'ring-1 ring-ink',
            )}
          >
            <p
              className={cx(
                'truncate text-[0.625rem] leading-tight font-semibold',
                homeStyles[stay.parent].text,
              )}
            >
              {names[stay.parent]}
            </p>
            <p
              className={cx(
                'numeral mt-1 truncate text-[0.625rem] leading-none',
                homeStyles[stay.parent].text,
              )}
            >
              {label}
            </p>
          </div>
        )
      })}
    </div>
  )
}
