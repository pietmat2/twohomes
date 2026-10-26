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

/**
 * The shape of the schedule, not a row of identical boxes: a long block is a
 * long stay. Week-on/week-off reads as two bars, 2-2-3 as a stutter.
 */
export function Ribbon({
  days,
  names,
  todayIso,
  onSelect,
  animate = true,
}: {
  days: DayAssignment[]
  names: Record<ParentId, string>
  todayIso?: string
  onSelect?: (iso: string) => void
  animate?: boolean
}) {
  const stays = toStays(days)

  return (
    <div className="flex gap-1" role="list">
      {stays.map((stay, index) => {
        const holdsToday = todayIso ? stay.days.some((d) => d.date === todayIso) : false
        const nights = stay.days.length
        return (
          <div
            key={stay.days[0].date}
            role="listitem"
            style={{
              flexGrow: nights,
              flexBasis: 0,
              animationDelay: animate ? `${index * 55}ms` : undefined,
            }}
            className={cx(
              'rounded-stay px-2 py-2.5 min-w-0',
              homeStyles[stay.parent].bg,
              animate && 'animate-stay',
              holdsToday && 'ring-1 ring-ink',
            )}
          >
            <p
              className={cx(
                'truncate text-[0.6875rem] font-semibold',
                homeStyles[stay.parent].text,
              )}
            >
              {names[stay.parent]}
            </p>
            <div className="mt-1.5 flex gap-0.5">
              {stay.days.map((day) => {
                const isToday = day.date === todayIso
                const cell = (
                  <span
                    className={cx(
                      'numeral block rounded-sm py-0.5 text-center text-[0.6875rem] leading-none',
                      isToday
                        ? cx(homeStyles[stay.parent].solid, 'text-paper font-semibold')
                        : homeStyles[stay.parent].text,
                    )}
                  >
                    {parseISO(day.date).getDate()}
                  </span>
                )
                return (
                  <span key={day.date} className="min-w-0 flex-1">
                    {onSelect ? (
                      <button
                        type="button"
                        onClick={() => onSelect(day.date)}
                        className="block w-full"
                        aria-label={day.date}
                      >
                        {cell}
                      </button>
                    ) : (
                      cell
                    )}
                  </span>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
