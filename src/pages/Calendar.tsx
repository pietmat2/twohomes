import { useMemo, useState } from 'react'
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { IconChevronLeft, IconChevronRight, IconPlus, IconSwap } from '../components/icons'
import {
  Bar,
  Button,
  CircleButton,
  Field,
  HomeTag,
  Hug,
  Pill,
  Row,
  Rows,
  SectionTitle,
  Segmented,
  Sheet,
  cx,
  homeStyles,
} from '../components/ui'
import { prettyTime } from '../lib/format'
import { holidaysBetween, holidaysOn, type Holiday } from '../lib/holidays'
import { useI18n } from '../lib/i18n'
import { assignmentFor, nightsSplit, otherParent, toISO } from '../lib/schedule'
import { nameOf, useApp } from '../lib/store'
import type { EventType, ParentId } from '../lib/types'

const EVENT_TYPES: { value: EventType }[] = [
  { value: 'school' },
  { value: 'activity' },
  { value: 'medical' },
  { value: 'birthday' },
  { value: 'other' },
]

type SheetMode = 'overview' | 'event' | 'swap'

export default function CalendarPage() {
  const { state, me, them } = useApp()
  const { t, monthTitle, weekdayNarrow, holidayName, dayRange, longDay, joinList } = useI18n()
  const [cursor, setCursor] = useState(() => new Date())
  const todayIso = toISO(new Date())
  const [selected, setSelected] = useState(todayIso)
  const [sheet, setSheet] = useState<{ date: string; mode: SheetMode } | null>(null)

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [cursor])

  const split = nightsSplit(state, startOfMonth(cursor), endOfMonth(cursor).getDate())
  const weekdayLabels = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) =>
      weekdayNarrow(new Date(base.getFullYear(), base.getMonth(), base.getDate() + i)),
    )
  }, [weekdayNarrow])

  const pendingSwaps = state.swaps.filter((s) => s.status === 'pending')

  // Holidays across the whole grid, including the days of the months either side.
  const gridHolidays = useMemo(
    () => holidaysBetween(state.holidays, toISO(days[0]), toISO(days[days.length - 1])),
    [state.holidays, days],
  )
  const monthHolidays = holidaysBetween(
    state.holidays,
    toISO(startOfMonth(cursor)),
    toISO(endOfMonth(cursor)),
  )
  const on = (date: string, kind: Holiday['kind']) =>
    gridHolidays.some((h) => h.kind === kind && h.start <= date && h.end >= date)

  /** The day a swap is asked for: the chosen one if it is yours, else your next one. */
  function askForSwap() {
    const chosen = assignmentFor(state, selected)
    if (chosen.parent === me && selected >= todayIso) {
      setSheet({ date: selected, mode: 'swap' })
      return
    }
    for (let i = 0; i < 60; i++) {
      const date = toISO(addDays(new Date(), i))
      if (assignmentFor(state, date).parent === me) {
        setSheet({ date, mode: 'swap' })
        return
      }
    }
  }

  const chosen = assignmentFor(state, selected)
  const chosenEvents = state.events
    .filter((e) => e.date === selected)
    .sort((x, y) => (x.time ?? '').localeCompare(y.time ?? ''))
  const chosenHolidays = holidaysOn(state.holidays, selected)
  const chosenSwap = pendingSwaps.find((s) => s.dates.includes(selected))

  return (
    <div className="relative">
      <Hug className="-left-[60px] top-[380px] opacity-90" />
      <div className="relative z-[1]">
        <Bar
          action={
            <Button size="sm" onClick={askForSwap}>
              {t('calendar.askForSwap')}
            </Button>
          }
        />

        <div className="mt-[30px] flex items-end justify-between gap-3">
          <h1 className="headline min-w-0 text-hero">{monthTitle(cursor)}</h1>
          <div className="flex shrink-0 gap-1.5 pb-1">
            <CircleButton
              tone="surface"
              label={t('calendar.previousMonth')}
              onClick={() => setCursor((c) => subMonths(c, 1))}
            >
              <IconChevronLeft width={18} height={18} strokeWidth={2.5} />
            </CircleButton>
            <CircleButton
              tone="surface"
              label={t('calendar.nextMonth')}
              onClick={() => setCursor((c) => addMonths(c, 1))}
            >
              <IconChevronRight width={18} height={18} strokeWidth={2.5} />
            </CircleButton>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <HomeTag
            parent={me}
            name={t('calendar.youNights', { nights: t('common.nights', { count: me === 'a' ? split.a : split.b }) })}
          />
          <HomeTag
            parent={them}
            name={t('calendar.themNights', {
              name: state.parents[them].name,
              nights: t('common.nights', { count: me === 'a' ? split.b : split.a }),
            })}
          />
        </div>

        <div className="numeral mt-5 grid grid-cols-7 gap-1">
          {weekdayLabels.map((label, index) => (
            <span key={index} aria-hidden className="pb-1 text-center text-micro font-bold text-muted">
              {label}
            </span>
          ))}
          {days.map((day) => {
            const iso = toISO(day)
            const assignment = assignmentFor(state, iso)
            const inMonth = isSameMonth(day, cursor)
            const events = state.events.some((e) => e.date === iso)
            const awaiting = pendingSwaps.some((s) => s.dates.includes(iso))
            const publicHoliday = on(iso, 'public')
            const schoolBreak = on(iso, 'school')
            return (
              <button
                key={iso}
                type="button"
                onClick={() => {
                  setSelected(iso)
                  if (!inMonth) setCursor(day)
                }}
                aria-pressed={selected === iso}
                aria-label={`${longDay(iso)}, ${nameOf(state, assignment.parent, t('common.you'))}`}
                className={cx(
                  'relative flex aspect-square items-center justify-center rounded-tile text-ui font-extrabold',
                  inMonth ? homeStyles[assignment.parent].bg : 'text-muted opacity-50',
                  iso === todayIso && 'shadow-[inset_0_0_0_2.5px_var(--color-ink)]',
                  selected === iso &&
                    iso !== todayIso &&
                    'outline-2 -outline-offset-[5px] outline-ink outline-dashed',
                )}
              >
                {/* A public holiday is underlined, like a red day in a printed calendar. */}
                <span className={cx(publicHoliday && 'underline decoration-2 underline-offset-[3px]')}>
                  {day.getDate()}
                </span>
                {/* A short bar along the top: the children are off school. */}
                {schoolBreak && inMonth ? (
                  <span aria-hidden className="absolute top-[5px] h-[3px] w-3 rounded-full bg-ink/60" />
                ) : null}
                {inMonth && (events || assignment.override || awaiting) ? (
                  <span aria-hidden className="absolute bottom-[5px] flex gap-[3px]">
                    {events ? <span className="size-[5px] rounded-full bg-ink" /> : null}
                    {/* Hollow: this day was moved off the pattern. */}
                    {assignment.override ? (
                      <span className="size-[5px] rounded-full border border-ink" />
                    ) : null}
                    {awaiting ? <span className="size-[5px] rounded-full bg-warn" /> : null}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>

        {monthHolidays.length > 0 ? (
          <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 px-1 text-xs font-bold text-muted">
            {monthHolidays.some((h) => h.kind === 'school') ? (
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="h-[3px] w-3 rounded-full bg-ink/60" />
                {t('calendar.schoolBreak')}
              </span>
            ) : null}
            {monthHolidays.some((h) => h.kind === 'public') ? (
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="numeral underline decoration-2 underline-offset-[3px]">
                  1
                </span>
                {t('calendar.publicHoliday')}
              </span>
            ) : null}
          </p>
        ) : null}

        {/* The chosen day, read without opening anything. */}
        <section className="mt-3.5 rounded-card bg-surface p-[22px]">
          <h2 className="kicker">{longDay(selected)}</h2>
          <ul className="mt-1 divide-y-[1.5px] divide-line text-ui">
            <li className="flex items-center justify-between gap-3 py-3.5">
              <b className="font-extrabold">
                {chosen.parent === me
                  ? t('calendar.withYou')
                  : t('calendar.withParent', { name: state.parents[chosen.parent].name })}
              </b>
              <span aria-hidden className={cx('size-3 shrink-0 rounded-full', homeStyles[chosen.parent].solid)} />
            </li>
            {chosen.isHandover ? (
              <li className="flex items-center justify-between gap-3 py-3.5">
                <span>
                  <b className="font-extrabold">{t('calendar.changeover')}</b>
                  {state.schedule.handoverPlace ? ` · ${state.schedule.handoverPlace}` : ''}
                </span>
                <span className="numeral">{prettyTime(state.schedule.handoverTime)}</span>
              </li>
            ) : null}
            {chosenEvents.map((event) => {
              const kids = joinList(
                state.kids.filter((k) => event.kidIds.includes(k.id)).map((k) => k.name),
              )
              return (
                <li key={event.id} className="flex items-center justify-between gap-3 py-3.5">
                  <span className="min-w-0">
                    <b className="font-extrabold">{event.title}</b>
                    {kids ? ` · ${kids}` : ''}
                  </span>
                  {event.time ? <span className="numeral shrink-0">{prettyTime(event.time)}</span> : null}
                </li>
              )
            })}
            {chosenHolidays.map((holiday) => (
              <li key={`${holiday.key}-${holiday.start}`} className="flex items-center justify-between gap-3 py-3.5">
                <b className="min-w-0 font-extrabold">{holidayName(holiday)}</b>
                <span className="shrink-0 text-sm text-muted">
                  {t(holiday.kind === 'school' ? 'calendar.schoolBreak' : 'calendar.publicHoliday')}
                </span>
              </li>
            ))}
            {chosen.override ? (
              <li className="py-3.5 text-muted">
                {chosen.override.reason
                  ? t('calendar.changedFromPatternReason', { reason: chosen.override.reason })
                  : t('calendar.changedFromPattern')}
              </li>
            ) : null}
            {chosenSwap ? <li className="py-3.5 text-muted">{t('calendar.noReplyYet')}</li> : null}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="primary" onClick={() => setSheet({ date: selected, mode: 'overview' })}>
              {t('calendar.changeDay')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSheet({ date: selected, mode: 'event' })}>
              <IconPlus width={14} height={14} strokeWidth={2.5} />
              {t('calendar.newEvent')}
            </Button>
          </div>
        </section>

        {monthHolidays.length > 0 ? (
          <section className="mt-3.5 rounded-card bg-surface p-[22px]">
            <h2 className="kicker">{t('calendar.holidays')}</h2>
            <ul className="mt-1 divide-y-[1.5px] divide-line text-ui">
              {monthHolidays.map((holiday) => (
                <li key={`${holiday.key}-${holiday.start}`} className="flex items-center justify-between gap-3 py-3.5">
                  <b className="min-w-0 font-extrabold">{holidayName(holiday)}</b>
                  <span className="numeral shrink-0 text-sm text-muted">{dayRange(holiday.start, holiday.end)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-10">
          <SwapRequests />
        </div>
      </div>

      {sheet ? (
        <DaySheet
          key={`${sheet.date}-${sheet.mode}`}
          date={sheet.date}
          initialMode={sheet.mode}
          onClose={() => setSheet(null)}
        />
      ) : null}
    </div>
  )
}

function SwapRequests() {
  const { state, actions, me } = useApp()
  const { t, friendlyDay, joinList } = useI18n()
  const open = state.swaps.filter((s) => s.status === 'pending')
  const settled = state.swaps
    .filter((s) => s.status !== 'pending')
    .sort((x, y) => (y.respondedAt ?? '').localeCompare(x.respondedAt ?? ''))
    .slice(0, 3)

  if (open.length === 0 && settled.length === 0) return null

  return (
    <section>
      <SectionTitle>{t('calendar.swapRequests')}</SectionTitle>
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
                  {mine
                    ? t('calendar.youAskedToCover', {
                        days: joinList(swap.dates.map((d) => friendlyDay(d))),
                      })
                    : t('calendar.askedYouToCover', {
                        name: state.parents[swap.from].name,
                        days: joinList(swap.dates.map((d) => friendlyDay(d))),
                      })}
                </p>
                {swap.message ? (
                  <p className="mt-1 text-sm text-muted italic">{swap.message}</p>
                ) : null}
                {mine ? (
                  <div className="mt-2 flex items-center gap-3">
                    <Pill tone="warn">{t('calendar.noReplyYet')}</Pill>
                    <button
                      type="button"
                      onClick={() => actions.removeSwap(swap.id)}
                      className="text-sm text-muted hover:text-ink"
                    >
                      {t('calendar.withdraw')}
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => actions.respondToSwap(swap.id, true)}
                    >
                      {t('today.takeThoseDays')}
                    </Button>
                    <Button size="sm" onClick={() => actions.respondToSwap(swap.id, false)}>
                      {t('today.cantDoIt')}
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
              {t('calendar.swapOutcome', {
                days: joinList(swap.dates.map((d) => friendlyDay(d))),
                outcome: t(swap.status === 'accepted' ? 'calendar.agreed' : 'calendar.declined'),
              })}
            </p>
            <button
              type="button"
              onClick={() => actions.removeSwap(swap.id)}
              className="text-sm text-faint hover:text-ink"
            >
              {t('common.clear')}
            </button>
          </Row>
        ))}
      </Rows>
    </section>
  )
}

function DaySheet({
  date,
  initialMode = 'overview',
  onClose,
}: {
  date: string
  initialMode?: SheetMode
  onClose: () => void
}) {
  const { state, actions, me } = useApp()
  const { t, longDay, joinList, holidayName } = useI18n()
  const assignment = assignmentFor(state, date)
  const holidays = holidaysOn(state.holidays, date)
  const events = state.events.filter((e) => e.date === date)
  const [mode, setMode] = useState<SheetMode>(initialMode)

  return (
    <Sheet open onClose={onClose} title={longDay(date)}>
      {mode === 'overview' ? (
        <div className="space-y-6">
          <div>
            <p className="wide text-xl font-semibold">
              {assignment.parent === me ? (
                t('calendar.withYou')
              ) : (
                <span className={homeStyles[assignment.parent].text}>
                  {t('calendar.withParent', { name: state.parents[assignment.parent].name })}
                </span>
              )}
            </p>
            {assignment.isHandover ? (
              <p className="mt-1 text-sm text-muted">
                {state.schedule.handoverPlace
                  ? t('calendar.changeoverAtPlace', {
                      time: prettyTime(state.schedule.handoverTime),
                      place: state.schedule.handoverPlace,
                    })
                  : t('calendar.changeoverAt', {
                      time: prettyTime(state.schedule.handoverTime),
                    })}
              </p>
            ) : null}
            {assignment.override ? (
              <p className="mt-1 text-sm text-muted">
                {assignment.override.reason
                  ? t('calendar.changedFromPatternReason', { reason: assignment.override.reason })
                  : t('calendar.changedFromPattern')}
              </p>
            ) : null}
            {holidays.length > 0 ? (
              <p className="mt-1 text-sm text-muted">{holidays.map(holidayName).join(' \u00b7 ')}</p>
            ) : null}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">{t('calendar.giveDayTo')}</p>
            <Segmented<ParentId>
              value={assignment.parent}
              onChange={(next) => {
                if (next === assignment.parent) return
                actions.setDayParent(date, next)
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
                {t('calendar.backToPattern')}
              </button>
            ) : null}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">{t('calendar.events')}</p>
              <Button size="sm" variant="ghost" onClick={() => setMode('event')}>
                <IconPlus width={15} height={15} />
                {t('common.add')}
              </Button>
            </div>
            {events.length === 0 ? (
              <p className="text-sm text-muted">{t('common.nothingScheduled')}</p>
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
                        {[
                          joinList(
                            state.kids
                              .filter((k) => event.kidIds.includes(k.id))
                              .map((k) => k.name),
                          ),
                          event.location ? t('calendar.atPlace', { place: event.location }) : '',
                          event.owner
                            ? t('calendar.takesThem', { name: state.parents[event.owner].name })
                            : '',
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                      {event.note ? <p className="mt-1 text-xs text-muted">{event.note}</p> : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => actions.removeEvent(event.id)}
                      className="text-sm text-faint hover:text-danger"
                    >
                      {t('common.remove')}
                    </button>
                  </Row>
                ))}
              </Rows>
            )}
          </div>

          {assignment.parent === me ? (
            <Button block onClick={() => setMode('swap')}>
              <IconSwap width={18} height={18} />
              {t('calendar.askToTake', { name: state.parents[otherParent(me)].name })}
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
              'h-[34px] rounded-full px-3.5 text-kicker font-bold transition-colors',
              on ? 'bg-ink text-onink' : 'bg-surface text-ink hover:bg-sunken',
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
  const { t } = useI18n()
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
      <Field label={t('calendar.whatIsIt')}>
        <input
          className="field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('calendar.eventPlaceholder')}
          autoFocus
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('calendar.time')}>
          <input
            type="time"
            className="field"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </Field>
        <Field label={t('calendar.kind')}>
          <select
            className="field"
            value={type}
            onChange={(e) => setType(e.target.value as EventType)}
          >
            {EVENT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {t(`event.${option.value}`)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label={t('calendar.where')}>
        <input
          className="field"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={t('calendar.wherePlaceholder')}
        />
      </Field>
      <Field label={t('calendar.whoFor')}>
        <KidPicker value={kidIds} onChange={setKidIds} />
      </Field>
      <Field label={t('calendar.note')} hint={t('calendar.noteHint')}>
        <textarea
          className="field"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" block>
          {t('calendar.addToCalendar')}
        </Button>
        <Button type="button" onClick={onDone}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  )
}

function SwapForm({ date, onDone }: { date: string; onDone: () => void }) {
  const { state, actions, me } = useApp()
  const { t, daySpoken } = useI18n()
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
        {t('calendar.swapExplainer', {
          name: state.parents[them].name,
          day: daySpoken(date),
        })}
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={alsoNextDay}
          onChange={(e) => setAlsoNextDay(e.target.checked)}
          className="size-4"
        />
        {t('calendar.alsoAskFor', { day: daySpoken(nextDay) })}
      </label>
      <Field label={t('calendar.message')} hint={t('calendar.messageHint')}>
        <textarea
          className="field"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('calendar.messagePlaceholder')}
          autoFocus
        />
      </Field>
      <Button type="submit" variant="primary" block>
        {t('calendar.sendRequest')}
      </Button>
    </form>
  )
}
