import { useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { IconChevronLeft, IconChevronRight, IconPlus, IconSwap } from '../components/icons'
import {
  Button,
  Field,
  HomeTag,
  Pill,
  Row,
  Rows,
  SectionTitle,
  Segmented,
  Sheet,
  cx,
  homeStyles,
} from '../components/ui'
import { daySpoken, friendlyDay, longDay, monthTitle, prettyTime } from '../lib/format'
import { assignmentFor, nightsSplit, otherParent, toISO, type DayAssignment } from '../lib/schedule'
import { useApp } from '../lib/store'
import type { EventType, ParentId } from '../lib/types'

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'school', label: 'School' },
  { value: 'activity', label: 'Activity' },
  { value: 'medical', label: 'Medical' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'other', label: 'Other' },
]

interface WeekRun {
  parent: ParentId
  days: DayAssignment[]
  /** The stay begins here, rather than carrying over from the previous week. */
  opensLeft: boolean
  /** The stay ends here, rather than continuing into the next week. */
  closesRight: boolean
}

/**
 * Split one week into the stays it contains. A stay running past Sunday is
 * left square on that edge, so the block visibly carries into the next row.
 */
function runsForWeek(days: DayAssignment[], nextDay: DayAssignment | null): WeekRun[] {
  const runs: WeekRun[] = []
  days.forEach((day, index) => {
    const current = runs[runs.length - 1]
    if (current && current.parent === day.parent) {
      current.days.push(day)
      return
    }
    runs.push({
      parent: day.parent,
      days: [day],
      opensLeft: index === 0 ? day.isHandover : true,
      closesRight: true,
    })
  })
  const last = runs[runs.length - 1]
  if (last) last.closesRight = nextDay ? nextDay.parent !== last.parent : true
  return runs
}

export default function CalendarPage() {
  const { state } = useApp()
  const [cursor, setCursor] = useState(() => new Date())
  const [selected, setSelected] = useState<string | null>(null)

  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
    const all = eachDayOfInterval({ start, end })
    return Array.from({ length: Math.ceil(all.length / 7) }, (_, i) => all.slice(i * 7, i * 7 + 7))
  }, [cursor])

  const split = nightsSplit(state, startOfMonth(cursor), endOfMonth(cursor).getDate())
  const weekdayLabels = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) =>
      new Date(base.getFullYear(), base.getMonth(), base.getDate() + i).toLocaleDateString(
        state.locale,
        { weekday: 'narrow' },
      ),
    )
  }, [state.locale])

  const pendingSwaps = state.swaps.filter((s) => s.status === 'pending')

  return (
    <div className="space-y-7">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-2xl font-semibold tracking-[-0.015em]">
          {monthTitle(cursor)}
        </h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setCursor((c) => subMonths(c, 1))}
            className="rounded-md p-1.5 text-muted hover:text-ink"
          >
            <IconChevronLeft width={18} height={18} />
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date())}
            className="px-1 text-sm text-muted hover:text-ink"
          >
            Today
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setCursor((c) => addMonths(c, 1))}
            className="rounded-md p-1.5 text-muted hover:text-ink"
          >
            <IconChevronRight width={18} height={18} />
          </button>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-7 gap-1">
          {weekdayLabels.map((label, index) => (
            <div key={index} className="pb-1.5 text-center text-xs text-faint">
              {label}
            </div>
          ))}
        </div>

        <div className="space-y-1">
          {weeks.map((week, weekIndex) => {
            const assignments = week.map((day) => assignmentFor(state, toISO(day)))
            const nextWeek = weeks[weekIndex + 1]
            const nextDay = nextWeek ? assignmentFor(state, toISO(nextWeek[0])) : null
            const runs = runsForWeek(assignments, nextDay)

            return (
              <div key={weekIndex} className="grid grid-cols-7 gap-1">
                {runs.map((run) => (
                  <div
                    key={run.days[0].date}
                    style={{ gridColumn: `span ${run.days.length}` }}
                    className={cx(
                      'flex overflow-hidden',
                      homeStyles[run.parent].bg,
                      run.opensLeft && 'rounded-l-stay',
                      run.closesRight && 'rounded-r-stay',
                    )}
                  >
                    {run.days.map((day) => {
                      const date = parseISO(day.date)
                      const inMonth = isSameMonth(date, cursor)
                      const events = state.events.filter((e) => e.date === day.date)
                      const awaiting = pendingSwaps.some((s) => s.dates.includes(day.date))
                      return (
                        <button
                          key={day.date}
                          type="button"
                          onClick={() => setSelected(day.date)}
                          className={cx(
                            'flex min-w-0 flex-1 flex-col items-center justify-center py-2.5',
                            homeStyles[run.parent].text,
                            !inMonth && 'opacity-30',
                          )}
                        >
                          <span
                            className={cx(
                              'numeral flex size-6 items-center justify-center text-[0.8125rem]',
                              isToday(date) &&
                                cx(
                                  'rounded-full font-bold text-paper',
                                  homeStyles[run.parent].solid,
                                ),
                            )}
                          >
                            {date.getDate()}
                          </span>
                          <span className="mt-1 flex h-1 items-center gap-0.5">
                            {events.length > 0 ? (
                              <span className="size-1 rounded-full bg-current" aria-hidden />
                            ) : null}
                            {awaiting ? (
                              <span className="size-1 rounded-full bg-warn" aria-hidden />
                            ) : null}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm text-muted">
          <HomeTag parent="a" name={`${state.parents.a.name}, ${split.a} nights`} />
          <HomeTag parent="b" name={`${state.parents.b.name}, ${split.b} nights`} />
        </div>
      </div>

      <SwapRequests />

      {selected ? (
        <DaySheet date={selected} onClose={() => setSelected(null)} key={selected} />
      ) : null}
    </div>
  )
}

function SwapRequests() {
  const { state, actions, me } = useApp()
  const open = state.swaps.filter((s) => s.status === 'pending')
  const settled = state.swaps
    .filter((s) => s.status !== 'pending')
    .sort((x, y) => (y.respondedAt ?? '').localeCompare(x.respondedAt ?? ''))
    .slice(0, 3)

  if (open.length === 0 && settled.length === 0) return null

  return (
    <section>
      <SectionTitle>Swap requests</SectionTitle>
      <Rows>
        {open.map((swap) => {
          const mine = swap.from === me
          return (
            <Row key={swap.id}>
              <span className="mt-0.5 text-muted">
                <IconSwap width={18} height={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  {mine ? 'You asked' : `${state.parents[swap.from].name} asked you`} to cover{' '}
                  {swap.dates.map((d) => friendlyDay(d)).join(' and ')}.
                </p>
                {swap.message ? (
                  <p className="mt-1 text-sm text-muted italic">{swap.message}</p>
                ) : null}
                {mine ? (
                  <div className="mt-2 flex items-center gap-3">
                    <Pill tone="warn">No reply yet</Pill>
                    <button
                      type="button"
                      onClick={() => actions.removeSwap(swap.id)}
                      className="text-sm text-muted hover:text-ink"
                    >
                      Withdraw
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => actions.respondToSwap(swap.id, true)}
                    >
                      Take those days
                    </Button>
                    <Button size="sm" onClick={() => actions.respondToSwap(swap.id, false)}>
                      Can&rsquo;t do it
                    </Button>
                  </div>
                )}
              </div>
            </Row>
          )
        })}
        {settled.map((swap) => (
          <Row key={swap.id}>
            <p className="flex-1 text-sm text-muted">
              {swap.dates.map((d) => friendlyDay(d)).join(' and ')} —{' '}
              {swap.status === 'accepted' ? 'agreed' : 'declined'}
            </p>
            <button
              type="button"
              onClick={() => actions.removeSwap(swap.id)}
              className="text-sm text-faint hover:text-ink"
            >
              Clear
            </button>
          </Row>
        ))}
      </Rows>
    </section>
  )
}

function DaySheet({ date, onClose }: { date: string; onClose: () => void }) {
  const { state, actions, me } = useApp()
  const assignment = assignmentFor(state, date)
  const events = state.events.filter((e) => e.date === date)
  const [mode, setMode] = useState<'overview' | 'event' | 'swap'>('overview')

  return (
    <Sheet open onClose={onClose} title={longDay(date)}>
      {mode === 'overview' ? (
        <div className="space-y-6">
          <div>
            <p className="font-display text-xl font-semibold">
              With{' '}
              <span className={homeStyles[assignment.parent].text}>
                {assignment.parent === me ? 'you' : state.parents[assignment.parent].name}
              </span>
            </p>
            {assignment.isHandover ? (
              <p className="mt-1 text-sm text-muted">
                Changeover at {prettyTime(state.schedule.handoverTime)}
                {state.schedule.handoverPlace ? `, ${state.schedule.handoverPlace}` : ''}
              </p>
            ) : null}
            {assignment.override ? (
              <p className="mt-1 text-sm text-muted">
                Changed from the usual pattern
                {assignment.override.reason ? `: ${assignment.override.reason}` : ''}
              </p>
            ) : null}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Give this day to</p>
            <Segmented<ParentId>
              value={assignment.parent}
              onChange={(next) => {
                if (next === assignment.parent) return
                actions.setDayParent(date, next, 'Changed on the calendar')
              }}
              options={[
                { value: 'a', label: state.parents.a.name },
                { value: 'b', label: state.parents.b.name },
              ]}
            />
            {assignment.override ? (
              <button
                type="button"
                onClick={() => actions.clearOverride(date)}
                className="mt-2 text-sm text-muted hover:text-ink"
              >
                Put it back to the pattern
              </button>
            ) : null}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">Events</p>
              <Button size="sm" variant="ghost" onClick={() => setMode('event')}>
                <IconPlus width={15} height={15} />
                Add
              </Button>
            </div>
            {events.length === 0 ? (
              <p className="text-sm text-muted">Nothing scheduled.</p>
            ) : (
              <Rows>
                {events.map((event) => (
                  <Row key={event.id}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {event.time ? `${prettyTime(event.time)} ` : ''}
                        {event.title}
                      </p>
                      <p className="text-xs text-muted">
                        {state.kids
                          .filter((k) => event.kidIds.includes(k.id))
                          .map((k) => k.name)
                          .join(' and ')}
                        {event.location ? ` at ${event.location}` : ''}
                        {event.owner ? `, ${state.parents[event.owner].name} takes them` : ''}
                      </p>
                      {event.note ? <p className="mt-1 text-xs text-muted">{event.note}</p> : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => actions.removeEvent(event.id)}
                      className="text-sm text-faint hover:text-danger"
                    >
                      Remove
                    </button>
                  </Row>
                ))}
              </Rows>
            )}
          </div>

          {assignment.parent === me ? (
            <Button block onClick={() => setMode('swap')}>
              <IconSwap width={18} height={18} />
              Ask {state.parents[otherParent(me)].name} to take this day
            </Button>
          ) : null}
        </div>
      ) : null}

      {mode === 'event' ? <EventForm date={date} onDone={() => setMode('overview')} /> : null}
      {mode === 'swap' ? <SwapForm date={date} onDone={onClose} /> : null}
    </Sheet>
  )
}

export function KidPicker({
  value,
  onChange,
}: {
  value: string[]
  onChange: (next: string[]) => void
}) {
  const { state } = useApp()
  if (state.kids.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {state.kids.map((kid) => {
        const on = value.includes(kid.id)
        return (
          <button
            key={kid.id}
            type="button"
            onClick={() => onChange(on ? value.filter((id) => id !== kid.id) : [...value, kid.id])}
            className={cx(
              'rounded-full border px-3 py-1.5 text-sm transition-colors',
              on ? 'border-ink bg-ink text-paper' : 'border-line text-muted hover:text-ink',
            )}
          >
            {kid.name}
          </button>
        )
      })}
    </div>
  )
}

function EventForm({ date, onDone }: { date: string; onDone: () => void }) {
  const { state, actions } = useApp()
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [type, setType] = useState<EventType>('activity')
  const [location, setLocation] = useState('')
  const [note, setNote] = useState('')
  const [kidIds, setKidIds] = useState<string[]>(state.kids.map((k) => k.id))

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!title.trim()) return
        actions.addEvent({
          date,
          title: title.trim(),
          time: time || undefined,
          type,
          location: location.trim() || undefined,
          note: note.trim() || undefined,
          kidIds,
        })
        onDone()
      }}
    >
      <Field label="What is it">
        <input
          className="field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Football practice"
          autoFocus
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Time">
          <input
            type="time"
            className="field"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </Field>
        <Field label="Kind">
          <select
            className="field"
            value={type}
            onChange={(e) => setType(e.target.value as EventType)}
          >
            {EVENT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Where">
        <input
          className="field"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Sports hall"
        />
      </Field>
      <Field label="Who it is for">
        <KidPicker value={kidIds} onChange={setKidIds} />
      </Field>
      <Field label="Note" hint="Anything the other home needs to know.">
        <textarea
          className="field"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" block>
          Add to the calendar
        </Button>
        <Button type="button" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function SwapForm({ date, onDone }: { date: string; onDone: () => void }) {
  const { state, actions, me } = useApp()
  const [message, setMessage] = useState('')
  const [alsoNextDay, setAlsoNextDay] = useState(false)
  const them = otherParent(me)
  const nextDay = toISO(new Date(parseISO(date).getTime() + 86_400_000))

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        actions.requestSwap({
          dates: alsoNextDay ? [date, nextDay] : [date],
          from: me,
          message: message.trim() || undefined,
        })
        onDone()
      }}
    >
      <p className="text-sm text-muted">
        {state.parents[them].name} is asked to take {daySpoken(date)}. The calendar only changes if
        they agree.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={alsoNextDay}
          onChange={(e) => setAlsoNextDay(e.target.checked)}
          className="size-4"
        />
        Ask for {daySpoken(nextDay)} too
      </label>
      <Field label="Message" hint="Short and factual works best.">
        <textarea
          className="field"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="I have a work trip that day."
          autoFocus
        />
      </Field>
      <Button type="submit" variant="primary" block>
        Send request
      </Button>
    </form>
  )
}
