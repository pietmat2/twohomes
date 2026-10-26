import { differenceInCalendarDays, parseISO, startOfMonth } from 'date-fns'
import { Link } from 'react-router-dom'
import { Button, Card, HomeTag, Pill, SectionTitle, Stat, cx, homeStyles } from '../components/ui'
import { IconBag, IconCheck, IconSwap } from '../components/icons'
import { friendlyDay, longDay, prettyTime } from '../lib/format'
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

  const pendingForMe = state.swaps.filter((s) => s.status === 'pending' && s.to === me)
  const pendingFromMe = state.swaps.filter((s) => s.status === 'pending' && s.from === me)

  const upcoming = state.events
    .filter((event) => event.date >= todayIso)
    .sort((x, y) => (x.date + (x.time ?? '')).localeCompare(y.date + (y.time ?? '')))
    .slice(0, 4)

  const week = assignmentsForRange(state, today, 7)
  const unpacked = state.bag.filter((item) => !item.packed)
  const latestMoment = [...state.moments].sort((x, y) => y.createdAt.localeCompare(x.createdAt))[0]

  const withMe = assignment.parent === me
  const holder = state.parents[assignment.parent]

  return (
    <div className="space-y-6">
      {/* The one question the app exists to answer at a glance. */}
      <Card className={cx('border-0 p-5', homeStyles[assignment.parent].bg)}>
        <p className="text-sm text-muted">{longDay(todayIso)}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">
          {state.kids.length === 0
            ? 'No children added yet'
            : withMe
              ? 'The children are with you'
              : `With ${holder.name}`}
        </p>
        {handover ? (
          <p className="mt-2 text-sm text-muted">
            Next changeover {friendlyDay(handover.date).toLowerCase()} at{' '}
            {prettyTime(state.schedule.handoverTime)}
            {state.schedule.handoverPlace ? `, ${state.schedule.handoverPlace}` : ''} — then{' '}
            {handover.parent === me
              ? 'they come to you'
              : `${state.parents[handover.parent].name} has them`}
            .
          </p>
        ) : null}
        {assignment.override ? (
          <p className="mt-2 text-xs text-muted">
            Set by hand: {assignment.override.reason ?? 'changed from the usual pattern'}
          </p>
        ) : null}
      </Card>

      {pendingForMe.length > 0 ? (
        <section>
          <SectionTitle>Waiting on you</SectionTitle>
          <div className="space-y-2">
            {pendingForMe.map((swap) => (
              <Card key={swap.id}>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-muted">
                    <IconSwap />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {state.parents[swap.from].name} asked you to take{' '}
                      {swap.dates.map((d) => friendlyDay(d)).join(', ')}
                    </p>
                    {swap.message ? (
                      <p className="mt-1 text-sm text-muted">“{swap.message}”</p>
                    ) : null}
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => actions.respondToSwap(swap.id, true)}
                      >
                        <IconCheck width={16} height={16} />
                        Accept
                      </Button>
                      <Button size="sm" onClick={() => actions.respondToSwap(swap.id, false)}>
                        Can&apos;t do it
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-3">
        <Stat
          label={balance.debtor === null ? 'Settled up' : 'Balance'}
          value={
            balance.debtor === null ? 'All square' : formatMoney(balance.amountCents, state)
          }
          sub={
            balance.debtor === null
              ? 'Nothing outstanding'
              : balance.debtor === me
                ? `You owe ${state.parents[them].name}`
                : `${state.parents[them].name} owes you`
          }
          tone={balance.debtor === null ? undefined : balance.creditor ?? undefined}
        />
        <Stat
          label="Nights this month"
          value={`${month.a} / ${month.b}`}
          sub={`${state.parents.a.name} / ${state.parents.b.name}`}
        />
      </section>

      <section>
        <SectionTitle
          action={
            <Link to="/calendar" className="text-xs font-medium text-muted hover:text-ink">
              Open calendar
            </Link>
          }
        >
          Next seven days
        </SectionTitle>
        <Card className="p-3">
          <ol className="grid grid-cols-7 gap-1">
            {week.map((day) => {
              const date = parseISO(day.date)
              return (
                <li key={day.date} className="text-center">
                  <p className="text-[0.625rem] font-medium tracking-wide text-faint uppercase">
                    {date.toLocaleDateString(state.locale, { weekday: 'narrow' })}
                  </p>
                  <div
                    className={cx(
                      'mt-1 flex h-11 flex-col items-center justify-center rounded-lg text-sm font-semibold',
                      homeStyles[day.parent].bg,
                      homeStyles[day.parent].text,
                    )}
                  >
                    {date.getDate()}
                    {day.isHandover ? (
                      <span className="mt-0.5 block size-1 rounded-full bg-current" aria-hidden />
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ol>
          <div className="mt-3 flex items-center justify-center gap-4 border-t border-line pt-3">
            <HomeTag parent="a" name={state.parents.a.name} className="text-xs text-muted" />
            <HomeTag parent="b" name={state.parents.b.name} className="text-xs text-muted" />
            <span className="text-xs text-faint">• changeover</span>
          </div>
        </Card>
      </section>

      {upcoming.length > 0 ? (
        <section>
          <SectionTitle>Coming up</SectionTitle>
          <ul className="space-y-2">
            {upcoming.map((event) => {
              const days = differenceInCalendarDays(parseISO(event.date), today)
              const whoHas = assignmentFor(state, event.date).parent
              const owner = event.owner ?? whoHas
              return (
                <Card as="li" key={event.id} className="flex items-center gap-3 py-3">
                  <div className="w-14 shrink-0 text-center">
                    <p className="text-xs text-muted">{friendlyDay(event.date)}</p>
                    {event.time ? (
                      <p className="text-sm font-semibold">{prettyTime(event.time)}</p>
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 border-l border-line pl-3">
                    <p className="truncate text-sm font-medium">{event.title}</p>
                    <p className="truncate text-xs text-muted">
                      {[
                        event.location,
                        state.kids
                          .filter((k) => event.kidIds.includes(k.id))
                          .map((k) => k.name)
                          .join(', '),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <Pill tone={owner === 'a' ? 'a' : 'b'}>
                    {days <= 0 ? 'today' : nameOf(state, owner)}
                  </Pill>
                </Card>
              )
            })}
          </ul>
        </section>
      ) : null}

      {handover && unpacked.length > 0 ? (
        <section>
          <SectionTitle
            action={
              <Link to="/kids" className="text-xs font-medium text-muted hover:text-ink">
                Edit list
              </Link>
            }
          >
            Goes in the bag
          </SectionTitle>
          <Card>
            <p className="mb-3 flex items-center gap-2 text-sm text-muted">
              <IconBag width={18} height={18} />
              {unpacked.length} still to pack before {friendlyDay(handover.date).toLowerCase()}
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
                      {kid ? <span className="text-muted"> · {kid.name}</span> : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </Card>
        </section>
      ) : null}

      {latestMoment ? (
        <section>
          <SectionTitle
            action={
              <Link to="/moments" className="text-xs font-medium text-muted hover:text-ink">
                See all
              </Link>
            }
          >
            Latest moment
          </SectionTitle>
          <Card className="flex gap-3">
            {latestMoment.photo ? (
              <img
                src={latestMoment.photo}
                alt=""
                className="size-16 shrink-0 rounded-xl object-cover"
              />
            ) : null}
            <div className="min-w-0">
              <p className="text-sm">{latestMoment.caption}</p>
              <p className="mt-1 text-xs text-muted">
                {nameOf(state, latestMoment.by)} · {friendlyDay(latestMoment.date)}
              </p>
            </div>
          </Card>
        </section>
      ) : null}

      {pendingFromMe.length > 0 ? (
        <p className="px-1 text-xs text-muted">
          You have {pendingFromMe.length} request
          {pendingFromMe.length === 1 ? '' : 's'} waiting on {state.parents[them].name}.
        </p>
      ) : null}

      {state.kids.length === 0 ? (
        <Card className="text-center">
          <p className="text-sm text-muted">
            Add your children to start tracking nights, costs and handovers.
          </p>
          <Link to="/kids" className="mt-3 inline-block">
            <Button variant="primary" size="sm">
              Add a child
            </Button>
          </Link>
        </Card>
      ) : null}
    </div>
  )
}
