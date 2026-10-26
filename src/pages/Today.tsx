import { differenceInCalendarDays, parseISO, startOfMonth } from 'date-fns'
import { Link } from 'react-router-dom'
import { Ribbon } from '../components/Ribbon'
import { Button, EmptyState, Pill, Row, Rows, SectionTitle, cx, homeStyles } from '../components/ui'
import { IconCheck, IconSwap } from '../components/icons'
import { useI18n } from '../lib/i18n'
import { balanceView, formatMoney } from '../lib/money'
import { assignmentFor, assignmentsForRange, nextHandover, nightsSplit, toISO } from '../lib/schedule'
import { nameOf, useApp } from '../lib/store'

export default function Today() {
  const { state, actions, me, them } = useApp()
  const { t, tNode, friendlyDay, daySpoken, longDay, joinList } = useI18n()

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
        title={t('today.noKidsTitle')}
        body={t('today.noKidsBody')}
        action={
          <Link to="/kids">
            <Button variant="primary" size="sm">
              {t('kids.addChild')}
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
          {withMe
            ? t('today.withYou')
            : tNode('today.withParent', {
                name: (
                  <span className={homeStyles[assignment.parent].text}>
                    {state.parents[assignment.parent].name}
                  </span>
                ),
              })}
          {handover ? (
            <span className="text-muted">
              {' '}
              {t('today.until', {
                day: daySpoken(handover.date),
                time: state.schedule.handoverTime,
              })}
            </span>
          ) : null}
        </h1>
        {handover && state.schedule.handoverPlace ? (
          <p className="mt-2 text-sm text-muted">
            {handover.parent === me
              ? t('today.handoverThenYou', { place: state.schedule.handoverPlace })
              : t('today.handoverThenThem', {
                  place: state.schedule.handoverPlace,
                  name: state.parents[handover.parent].name,
                })}
          </p>
        ) : null}
        {assignment.override ? (
          <p className="mt-2 text-sm text-muted">
            {assignment.override.reason
              ? t('today.changedByHandReason', { reason: assignment.override.reason })
              : t('today.changedByHand')}
          </p>
        ) : null}

        <div className="mt-5">
          <Ribbon
            days={fortnight}
            names={{ a: state.parents.a.name, b: state.parents.b.name }}
            todayIso={todayIso}
          />
          <p className="mt-2 text-xs text-faint">{t('today.ribbonCaption')}</p>
        </div>
      </section>

      {pendingForMe.length > 0 ? (
        <section>
          <SectionTitle>{t('today.waitingOnYou')}</SectionTitle>
          <Rows>
            {pendingForMe.map((swap) => (
              <Row key={swap.id}>
                <span className="mt-0.5 text-muted">
                  <IconSwap width={18} height={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    {t('today.askedYouToTake', {
                      name: state.parents[swap.from].name,
                      days: joinList(swap.dates.map((d) => friendlyDay(d))),
                    })}
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
                      {t('today.takeThoseDays')}
                    </Button>
                    <Button size="sm" onClick={() => actions.respondToSwap(swap.id, false)}>
                      {t('today.cantDoIt')}
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
            t('today.allSquare')
          ) : (
            <>
              {balance.debtor === me
                ? t('today.youOwe', { name: state.parents[them].name })
                : t('today.owesYou', { name: state.parents[them].name })}{' '}
              <Link to="/money" className="numeral font-semibold underline underline-offset-4">
                {formatMoney(balance.amountCents, state)}
              </Link>
            </>
          )}
        </p>
        <p className="text-[0.9375rem] text-muted">
          {t('today.nightsThisMonth', {
            mine: t('common.nights', { count: me === 'a' ? month.a : month.b }),
            theirs: t('common.nights', { count: me === 'a' ? month.b : month.a }),
            name: state.parents[them].name,
          })}
        </p>
      </section>

      {upcoming.length > 0 ? (
        <section>
          <SectionTitle
            action={
              <Link to="/calendar" className="text-sm text-muted hover:text-ink">
                {t('nav.calendar')}
              </Link>
            }
          >
            {t('today.comingUp')}
          </SectionTitle>
          <Rows>
            {upcoming.map((event) => {
              const days = differenceInCalendarDays(parseISO(event.date), today)
              const owner = event.owner ?? assignmentFor(state, event.date).parent
              const kids = joinList(
                state.kids.filter((k) => event.kidIds.includes(k.id)).map((k) => k.name),
              )
              return (
                <Row key={event.id}>
                  <div className="w-16 shrink-0">
                    <p className="text-xs text-muted">{friendlyDay(event.date)}</p>
                    {event.time ? (
                      <p className="numeral text-sm font-semibold">{event.time}</p>
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{event.title}</p>
                    <p className="truncate text-xs text-muted">
                      {[kids, event.location ? t('calendar.atPlace', { place: event.location }) : '']
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                  <Pill tone={owner === 'a' ? 'a' : 'b'}>
                    {days <= 0 ? t('date.today') : nameOf(state, owner, t('common.you'))}
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
                {t('today.editList')}
              </Link>
            }
          >
            {t('today.stillToPack')}
          </SectionTitle>
          <p className="mb-3 text-sm text-muted">
            {t('today.packBefore', { day: daySpoken(handover.date) })}
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
                    {kid ? (
                      <span className="text-muted"> {t('today.packFor', { name: kid.name })}</span>
                    ) : null}
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
                {t('today.allMoments')}
              </Link>
            }
          >
            {t('today.latestMoment')}
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
                {t('moments.byline', {
                  name: nameOf(state, latestMoment.by, t('common.you')),
                  day: daySpoken(latestMoment.date),
                })}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {pendingFromMe.length > 0 ? (
        <p className="text-sm text-muted">
          {t('today.requestsWaiting', {
            count: pendingFromMe.length,
            name: state.parents[them].name,
          })}
        </p>
      ) : null}
    </div>
  )
}
