import { differenceInCalendarDays, parseISO, startOfMonth } from 'date-fns'
import { Link } from 'react-router-dom'
import { Ribbon } from '../components/Ribbon'
import { Button, EmptyState, Pill, Row, Rows, SectionTitle, cx, homeStyles } from '../components/ui'
import { IconCheck, IconSwap } from '../components/icons'
import { daySpoken, friendlyDay, longDay, prettyTime } from '../lib/format'
import { balanceView, formatMoney } from '../lib/money'
import { assignmentFor, assignmentsForRange, nextHandover, nightsSplit, toISO } from '../lib/schedule'
import { nameOf, useApp } from '../lib/store'

export default function Today() {
  const { state, actions, me, them } = useApp()
  const today = new Date()
  const todayIso = toISO(today)
  const assignment = assignmentFor(state, todayIso)
  const handover = nextHandover(state, today)
  const balance = balanceView(state.expenses, state.settlements)
  const month = nightsSplit(state, startOfMonth(today), 30)
  const fortnight = assignmentsForRange(state, today, 14)

  const pendingForMe = state.swaps.filter((s) => s.status === 'pending' && s.to === me)
  const pendingFromMe = state.swaps.filter((s) => s.status === 'pending' && s.from === me)

  const upcoming = state.events
    .filter((event) => event.date >= todayIso)
    .sort((x, y) => (x.date + (x.time ?? '')).localeCompare(y.date + (y.time ?? '')))
    .slice(0, 4)

  const unpacked = state.bag.filter((item) => !item.packed)
  const latestMoment = [...state.moments].sort((x, y) => y.createdAt.localeCompare(x.createdAt))[0]
  const withMe = assignment.parent === me

  if (state.kids.length === 0) {
    return (
      <EmptyState
        title="Start with your children"
        body="Nights, costs, events and the bag list all hang off this."
        action={
          <Link to="/kids">
            <Button variant="primary" size="sm">
              Add a child
            </Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* The question the app exists to answer, written as a sentence. */}
      <section>
        <p className="text-sm text-muted">{longDay(todayIso)}</p>
        <h1 className="mt-1 font-display text-[2rem] leading-[1.15] font-semibold tracking-[-0.015em]">
          {withMe ? (
            <>They&rsquo;re with you</>
          ) : (
            <>
              They&rsquo;re with{' '}
              <span className={homeStyles[assignment.parent].text}>
                {state.parents[assignment.parent].name}
              </span>
            </>
          )}
          {handover ? (
            <span className="text-muted">
              {' '}
              until {daySpoken(handover.date)} at{' '}
              {prettyTime(state.schedule.handoverTime)}
            </span>
          ) : null}
        </h1>
        {handover && state.schedule.handoverPlace ? (
          <p className="mt-2 text-sm text-muted">
            Changeover at {state.schedule.handoverPlace}, then{' '}
            {handover.parent === me ? 'they come to you' : `${state.parents[handover.parent].name} has them`}.
          </p>
        ) : null}
        {assignment.override ? (
          <p className="mt-2 text-sm text-muted">
            Today was changed by hand
            {assignment.override.reason ? `: ${assignment.override.reason}` : ''}.
          </p>
        ) : null}

        <div className="mt-5">
          <Ribbon
            days={fortnight}
            names={{ a: state.parents.a.name, b: state.parents.b.name }}
            todayIso={todayIso}
          />
          <p className="mt-2 text-xs text-faint">The next fortnight, one block per stay.</p>
        </div>
      </section>

      {pendingForMe.length > 0 ? (
        <section>
          <SectionTitle>Waiting on you</SectionTitle>
          <Rows>
            {pendingForMe.map((swap) => (
              <Row key={swap.id}>
                <span className="mt-0.5 text-muted">
                  <IconSwap width={18} height={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    {state.parents[swap.from].name} asked you to take{' '}
                    {swap.dates.map((d) => friendlyDay(d)).join(' and ')}.
                  </p>
                  {swap.message ? (
                    <p className="mt-1 text-sm text-muted italic">{swap.message}</p>
                  ) : null}
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => actions.respondToSwap(swap.id, true)}
                    >
                      <IconCheck width={16} height={16} />
                      Take those days
                    </Button>
                    <Button size="sm" onClick={() => actions.respondToSwap(swap.id, false)}>
                      Can&rsquo;t do it
                    </Button>
                  </div>
                </div>
              </Row>
            ))}
          </Rows>
        </section>
      ) : null}

      <section className="space-y-1.5">
        <p className="text-[0.9375rem]">
          {balance.debtor === null ? (
            'Nothing is outstanding between the two homes.'
          ) : balance.debtor === me ? (
            <>
              You owe {state.parents[them].name}{' '}
              <Link to="/money" className="numeral font-semibold underline underline-offset-4">
                {formatMoney(balance.amountCents, state)}
              </Link>
              .
            </>
          ) : (
            <>
              {state.parents[them].name} owes you{' '}
              <Link to="/money" className="numeral font-semibold underline underline-offset-4">
                {formatMoney(balance.amountCents, state)}
              </Link>
              .
            </>
          )}
        </p>
        <p className="text-[0.9375rem] text-muted">
          This month you have <span className="numeral text-ink">{me === 'a' ? month.a : month.b}</span>{' '}
          nights and {state.parents[them].name} has{' '}
          <span className="numeral text-ink">{me === 'a' ? month.b : month.a}</span>.
        </p>
      </section>

      {upcoming.length > 0 ? (
        <section>
          <SectionTitle
            action={
              <Link to="/calendar" className="text-sm text-muted hover:text-ink">
                Calendar
              </Link>
            }
          >
            Coming up
          </SectionTitle>
          <Rows>
            {upcoming.map((event) => {
              const days = differenceInCalendarDays(parseISO(event.date), today)
              const owner = event.owner ?? assignmentFor(state, event.date).parent
              const kids = state.kids
                .filter((k) => event.kidIds.includes(k.id))
                .map((k) => k.name)
                .join(' and ')
              return (
                <Row key={event.id}>
                  <div className="w-16 shrink-0">
                    <p className="text-xs text-muted">{friendlyDay(event.date)}</p>
                    {event.time ? (
                      <p className="numeral text-sm font-semibold">{prettyTime(event.time)}</p>
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{event.title}</p>
                    <p className="truncate text-xs text-muted">
                      {kids}
                      {event.location ? ` at ${event.location}` : ''}
                    </p>
                  </div>
                  <Pill tone={owner === 'a' ? 'a' : 'b'}>
                    {days <= 0 ? 'Today' : nameOf(state, owner)}
                  </Pill>
                </Row>
              )
            })}
          </Rows>
        </section>
      ) : null}

      {handover && unpacked.length > 0 ? (
        <section>
          <SectionTitle
            action={
              <Link to="/kids" className="text-sm text-muted hover:text-ink">
                Edit list
              </Link>
            }
          >
            Still to pack
          </SectionTitle>
          <p className="mb-3 text-sm text-muted">
            Before {daySpoken(handover.date)}. Tap one once it is in the bag.
          </p>
          <ul className="flex flex-wrap gap-2">
            {unpacked.map((item) => {
              const kid = state.kids.find((k) => k.id === item.kidId)
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => actions.toggleBagItem(item.id)}
                    className="rounded-full border border-line px-3 py-1.5 text-sm hover:bg-sunken"
                  >
                    {item.label}
                    {kid ? <span className="text-muted"> for {kid.name}</span> : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {latestMoment ? (
        <section>
          <SectionTitle
            action={
              <Link to="/moments" className="text-sm text-muted hover:text-ink">
                All moments
              </Link>
            }
          >
            Latest moment
          </SectionTitle>
          <div className="flex gap-3">
            {latestMoment.photo ? (
              <img
                src={latestMoment.photo}
                alt=""
                className={cx('size-16 shrink-0 rounded-card object-cover')}
              />
            ) : null}
            <div className="min-w-0">
              <p className="text-[0.9375rem]">{latestMoment.caption}</p>
              <p className="mt-1 text-xs text-muted">
                {nameOf(state, latestMoment.by)}, {daySpoken(latestMoment.date)}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {pendingFromMe.length > 0 ? (
        <p className="text-sm text-muted">
          {pendingFromMe.length === 1 ? 'One request is' : `${pendingFromMe.length} requests are`}{' '}
          waiting on {state.parents[them].name}.
        </p>
      ) : null}
    </div>
  )
}
