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
  Card,
  Field,
  HomeTag,
  Pill,
  SectionTitle,
  Segmented,
  Sheet,
  cx,
  homeStyles,
} from '../components/ui'
import { friendlyDay, longDay, monthTitle, prettyTime } from '../lib/format'
import { assignmentFor, nightsSplit, otherParent, toISO } from '../lib/schedule'
import { nameOf, useApp } from '../lib/store'
import type { EventType, ParentId } from '../lib/types'

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'school', label: 'School' },
  { value: 'activity', label: 'Activity' },
  { value: 'medical', label: 'Medical' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'other', label: 'Other' },
]

export default function CalendarPage() {
  const { state } = useApp()
  const [cursor, setCursor] = useState(() => new Date())
  const [selected, setSelected] = useState<string | null>(null)

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [cursor])

  const monthStart = startOfMonth(cursor)
  const monthDays = endOfMonth(cursor).getDate()
  const split = nightsSplit(state, monthStart, monthDays)
  const weekdayLabels = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) =>
      new Date(base.getFullYear(), base.getMonth(), base.getDate() + i).toLocaleDateString(
        state.locale,
        { weekday: 'short' },
      ),
    )
  }, [state.locale])

  const pendingSwaps = state.swaps.filter((s) => s.status === 'pending')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">{monthTitle(cursor)}</h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setCursor((c) => subMonths(c, 1))}
            className="rounded-lg p-2 text-muted hover:bg-sunken hover:text-ink"
          >
            <IconChevronLeft />
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date())}
            className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-sunken hover:text-ink"
          >
            Today
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setCursor((c) => addMonths(c, 1))}
            className="rounded-lg p-2 text-muted hover:bg-sunken hover:text-ink"
          >
            <IconChevronRight />
          </button>
        </div>
      </div>

      <Card className="p-3">
        <div className="mb-1 grid grid-cols-7 gap-1">
          {weekdayLabels.map((label) => (
            <div
              key={label}
              className="py-1 text-center text-[0.625rem] font-medium tracking-wide text-faint uppercase"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const iso = toISO(day)
            const assignment = assignmentFor(state, iso)
            const inMonth = isSameMonth(day, cursor)
            const dayEvents = state.events.filter((e) => e.date === iso)
            const hasPendingSwap = pendingSwaps.some((s) => s.dates.includes(iso))
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelected(iso)}
                className={cx(
                  'relative flex h-14 flex-col items-center justify-center rounded-lg text-sm transition',
                  homeStyles[assignment.parent].bg,
                  homeStyles[assignment.parent].text,
                  !inMonth && 'opacity-35',
                  isToday(day) && 'ring-2 ring-ink ring-offset-1 ring-offset-surface',
                )}
              >
                <span className={cx('font-semibold', isToday(day) && 'underline')}>
                  {day.getDate()}
                </span>
                <span className="mt-1 flex h-1.5 items-center gap-0.5">
                  {assignment.isHandover ? (
                    <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
                  ) : null}
                  {dayEvents.length > 0 ? (
                    <span className="size-1.5 rounded-full bg-ink opacity-45" aria-hidden />
                  ) : null}
                  {hasPendingSwap ? (
                    <span className="size-1.5 rounded-full bg-warn" aria-hidden />
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-line pt-3 text-xs text-muted">
          <HomeTag parent="a" name={`${state.parents.a.name} · ${split.a}`} />
          <HomeTag parent="b" name={`${state.parents.b.name} · ${split.b}`} />
          <span className="text-faint">nights this month</span>
        </div>
      </Card>

      <SwapRequestsSection />

      {selected ? (
        <DaySheet date={selected} onClose={() => setSelected(null)} key={selected} />
      ) : null}
    </div>
  )
}

function SwapRequestsSection() {
  const { state, actions, me } = useApp()
  const open = state.swaps.filter((s) => s.status === 'pending')
  const recent = state.swaps
    .filter((s) => s.status !== 'pending')
    .sort((x, y) => (y.respondedAt ?? '').localeCompare(x.respondedAt ?? ''))
    .slice(0, 3)

  if (open.length === 0 && recent.length === 0) return null

  return (
    <section>
      <SectionTitle>Swap requests</SectionTitle>
      <ul className="space-y-2">
        {open.map((swap) => {
          const mine = swap.from === me
          return (
            <Card as="li" key={swap.id}>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-muted">
                  <IconSwap />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {mine ? 'You asked' : `${state.parents[swap.from].name} asked you`} to cover{' '}
                    {swap.dates.map((d) => friendlyDay(d)).join(', ')}
                  </p>
                  {swap.message ? <p className="mt-1 text-sm text-muted">“{swap.message}”</p> : null}
                  {mine ? (
                    <div className="mt-2 flex items-center gap-3">
                      <Pill tone="warn">Waiting for a reply</Pill>
                      <button
                        type="button"
                        onClick={() => actions.removeSwap(swap.id)}
                        className="text-xs text-muted hover:text-ink"
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
                        Accept
                      </Button>
                      <Button size="sm" onClick={() => actions.respondToSwap(swap.id, false)}>
                        Can&apos;t do it
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
        {recent.map((swap) => (
          <li
            key={swap.id}
            className="flex items-center justify-between px-1 text-xs text-muted"
          >
            <span>
              {swap.dates.map((d) => friendlyDay(d)).join(', ')} ·{' '}
              {swap.status === 'accepted' ? 'accepted' : 'declined'}
            </span>
            <button
              type="button"
              onClick={() => actions.removeSwap(swap.id)}
              className="hover:text-ink"
            >
              Clear
            </button>
          </li>
        ))}
      </ul>
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
        <div className="space-y-5">
          <div>
            <p className="text-sm text-muted">With</p>
            <p className="mt-0.5 flex items-center gap-2 text-lg font-semibold">
              <span
                className={cx('size-2.5 rounded-full', homeStyles[assignment.parent].solid)}
                aria-hidden
              />
              {nameOf(state, assignment.parent)}
            </p>
            {assignment.isHandover ? (
              <p className="mt-1 text-sm text-muted">
                Changeover at {prettyTime(state.schedule.handoverTime)}
                {state.schedule.handoverPlace ? `, ${state.schedule.handoverPlace}` : ''}
              </p>
            ) : null}
            {assignment.override ? (
              <p className="mt-1 text-xs text-muted">
                Changed from the pattern
                {assignment.override.reason ? `: ${assignment.override.reason}` : ''}
              </p>
            ) : null}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Assign this day to</p>
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
                className="mt-2 text-xs text-muted hover:text-ink"
              >
                Reset to the usual pattern
              </button>
            ) : null}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">Events</p>
              <Button size="sm" variant="ghost" onClick={() => setMode('event')}>
                <IconPlus width={16} height={16} />
                Add
              </Button>
            </div>
            {events.length === 0 ? (
              <p className="text-sm text-muted">Nothing scheduled.</p>
            ) : (
              <ul className="space-y-2">
                {events.map((event) => (
                  <li
                    key={event.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-line px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {event.time ? `${prettyTime(event.time)} · ` : ''}
                        {event.title}
                      </p>
                      <p className="text-xs text-muted">
                        {[
                          event.location,
                          state.kids
                            .filter((k) => event.kidIds.includes(k.id))
                            .map((k) => k.name)
                            .join(', '),
                          event.owner ? `${state.parents[event.owner].name} takes them` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                      {event.note ? (
                        <p className="mt-1 text-xs text-muted">{event.note}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => actions.removeEvent(event.id)}
                      className="text-xs text-muted hover:text-danger"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
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

      {mode === 'event' ? (
        <EventForm date={date} onDone={() => setMode('overview')} />
      ) : null}

      {mode === 'swap' ? <SwapForm date={date} onDone={onClose} /> : null}
    </Sheet>
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
      {state.kids.length > 0 ? (
        <Field label="Who it is for">
          <div className="flex flex-wrap gap-2">
            {state.kids.map((kid) => {
              const on = kidIds.includes(kid.id)
              return (
                <button
                  key={kid.id}
                  type="button"
                  onClick={() =>
                    setKidIds((prev) =>
                      on ? prev.filter((id) => id !== kid.id) : [...prev, kid.id],
                    )
                  }
                  className={cx(
                    'rounded-full border px-3 py-1.5 text-sm transition',
                    on ? 'border-ink bg-ink text-paper' : 'border-line text-muted hover:bg-sunken',
                  )}
                >
                  {kid.name}
                </button>
              )
            })}
          </div>
        </Field>
      ) : null}
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
        This asks {state.parents[them].name} to take {friendlyDay(date)}. Nothing moves on the
        calendar until they accept.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={alsoNextDay}
          onChange={(e) => setAlsoNextDay(e.target.checked)}
          className="size-4 rounded border-line"
        />
        Include {friendlyDay(nextDay).toLowerCase()} as well
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
