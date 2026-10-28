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
 * The fortnight as a row of pills, one per stay, each as long as the stay.
 * Colour is the answer — lime is you — so the pills carry no words; the
 * stay holding today is ringed. Each pill still names itself to a screen
 * reader.
 */
export function Ribbon({
  days,
  describe,
  todayIso,
  animate = true,
}: {
  days: DayAssignment[]
  /** What a screen reader hears for a stay: "Jonas, 27–28". */
  describe: (stay: Stay) => string
  todayIso?: string
  animate?: boolean
}) {
  const stays = toStays(days)

  return (
    <div className="flex gap-[3px]" role="list">
      {stays.map((stay, index) => {
        const holdsToday = todayIso ? stay.days.some((d) => d.date === todayIso) : false
        return (
          <div
            key={stay.days[0].date}
            role="listitem"
            aria-label={describe(stay)}
            style={{
              flexGrow: stay.days.length,
              flexBasis: 0,
              animationDelay: animate ? `${index * 55}ms` : undefined,
            }}
            className={cx(
              'h-[30px] min-w-0 rounded-full',
              homeStyles[stay.parent].bg,
              animate && 'animate-stay',
              holdsToday && 'shadow-[inset_0_0_0_2.5px_var(--color-ink)]',
            )}
          />
        )
      })}
    </div>
  )
}
