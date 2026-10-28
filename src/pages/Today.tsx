import { useEffect, useState, type ReactNode } from 'react'
import { addDays, differenceInCalendarDays, format, getISOWeek, parseISO } from 'date-fns'
import { Link, useNavigate } from 'react-router-dom'
import { Ribbon } from '../components/Ribbon'
import { IconMenu } from '../components/icons'
import { Button, CircleButton, EmptyState, Hug, cx, homeStyles } from '../components/ui'
import { recentChanges, type ChangeEntry } from '../lib/changes'
import { topicOfTheWeek } from '../lib/guide'
import { upcomingBreaks } from '../lib/holidays'
import { useI18n } from '../lib/i18n'
import { balanceView, formatMoney } from '../lib/money'
import { assignmentFor, assignmentsForRange, nextHandover, toISO } from '../lib/schedule'
import { nameOf, useApp } from '../lib/store'

/** One thing that needs this parent, as a card in the stack. */
interface StackCard {
  key: string
  /** A tailwind background for the card. */
  tone: string
  kicker: string
  title: ReactNode
  body?: ReactNode
  quote?: string
  actions: { label: string; kind: 'primary' | 'secondary' | 'ghost'; run: () => void }[]
}

/** How long a card takes to slide away before the next one rises. */
const LEAVE_MS = 320

export default function Today() {
  const { state, actions, me, them } = useApp()
  const { t, tNode, friendlyDay, daySpoken, joinList, holidayName, dayRange, dates } = useI18n()
  const navigate = useNavigate()
  const [leaving, setLeaving] = useState<string | null>(null)

  const today = new Date()
  const todayIso = toISO(today)
  const assignment = assignmentFor(state, todayIso)
  const handover = nextHandover(state, today)
  const balance = balanceView(state.expenses, state.settlements)
  const fortnight = assignmentsForRange(state, today, 14)
  const changes = recentChanges(state, 5)
  const dismissed = state.dismissed ?? {}
  const withMe = assignment.parent === me

  /** Neutral, attributed, past tense. Never "your ex", never a judgement. */
  function describe(change: ChangeEntry): string {
    if (change.kind === 'moved') {
      const vars = {
        day: friendlyDay(change.date),
        home: state.parents[change.parent].name,
        who: change.by ? nameOf(state, change.by, t('common.you')) : '',
        reason: change.reason ?? '',
      }
      if (!change.by) return t('changes.movedUnattributed', vars)
      return change.reason ? t('changes.movedReason', vars) : t('changes.moved', vars)
    }
    const vars = {
      who: nameOf(state, change.by, t('common.you')),
      days: joinList(change.dates.map((d) => friendlyDay(d))),
    }
    if (change.kind === 'asked') return t('changes.asked', vars)
    return t(change.kind === 'agreed' ? 'changes.agreed' : 'changes.declined', vars)
  }

  const dismiss = (key: string) => () => actions.dismissCard(key)

  // The stack, most urgent on top: what the other home is waiting for, what
  // has to happen before the next changeover, then what is merely coming.
  const cards: StackCard[] = []

  for (const swap of state.swaps.filter((s) => s.status === 'pending' && s.to === me)) {
    cards.push({
      key: `swap:${swap.id}`,
      tone: homeStyles[swap.from].bg,
      kicker: t('today.waitingOnYou'),
      title: t('today.askedYouToTake', {
        name: state.parents[swap.from].name,
        days: joinList(swap.dates.map((d) => friendlyDay(d))),
      }),
      quote: swap.message,
      actions: [
        { label: t('today.takeThoseDays'), kind: 'primary', run: () => actions.respondToSwap(swap.id, true) },
        { label: t('today.cantDoIt'), kind: 'secondary', run: () => actions.respondToSwap(swap.id, false) },
      ],
    })
  }

  const unpacked = state.bag.filter((item) => !item.packed)
  if (handover && unpacked.length > 0 && differenceInCalendarDays(parseISO(handover.date), today) <= 1) {
    cards.push({
      key: 'pack',
      tone: homeStyles[me].bg,
      kicker: t('today.packKicker', { day: daySpoken(handover.date) }),
      title: joinList(unpacked.map((item) => item.label)),
      actions: [
        {
          label: t('today.allPacked'),
          kind: 'primary',
          run: () => actions.update((s) => ({ ...s, bag: s.bag.map((b) => ({ ...b, packed: true })) })),
        },
        { label: t('today.editList'), kind: 'secondary', run: () => navigate('/kids') },
      ],
    })
  }

  const soon = toISO(addDays(today, 2))
  for (const event of state.events
    .filter((e) => e.date >= todayIso && e.date <= soon && !dismissed[`event:${e.id}`])
    .sort((x, y) => (x.date + (x.time ?? '')).localeCompare(y.date + (y.time ?? '')))) {
    const kids = joinList(state.kids.filter((k) => event.kidIds.includes(k.id)).map((k) => k.name))
    cards.push({
      key: `event:${event.id}`,
      tone: 'bg-sand',
      kicker: event.time
        ? t('today.comingUpAt', { day: daySpoken(event.date), time: event.time })
        : t('today.comingUpOn', { day: daySpoken(event.date) }),
      title: event.title,
      body: [kids, event.location ? t('calendar.atPlace', { place: event.location }) : '']
        .filter(Boolean)
        .join(', '),
      actions: [{ label: t('today.gotIt'), kind: 'primary', run: dismiss(`event:${event.id}`) }],
    })
  }

  if (balance.debtor !== null && !dismissed[`money:${todayIso}`]) {
    cards.push({
      key: `money:${todayIso}`,
      tone: 'bg-pink',
      kicker: t('nav.money'),
      title: (
        <>
          {balance.debtor === me
            ? t('today.youOwe', { name: state.parents[them].name })
            : t('today.owesYou', { name: state.parents[them].name })}{' '}
          <span className="numeral whitespace-nowrap">{formatMoney(balance.amountCents, state)}</span>
        </>
      ),
      actions: [
        { label: t('money.recordPayment'), kind: 'primary', run: () => navigate('/money', { state: { settle: true } }) },
        { label: t('today.later'), kind: 'ghost', run: dismiss(`money:${todayIso}`) },
      ],
    })
  }

  for (const moment of state.moments.filter((m) => m.by !== me && !m.seenByOther)) {
    cards.push({
      key: `moment:${moment.id}`,
      tone: homeStyles[moment.by].bg,
      kicker: t('today.newFrom', { name: state.parents[moment.by].name }),
      title: moment.caption || t('moments.sharedPhoto'),
      body: daySpoken(moment.date),
      actions: [
        { label: t('today.look'), kind: 'primary', run: () => navigate('/moments') },
        { label: t('moments.markSeen'), kind: 'secondary', run: () => actions.markMomentSeen(moment.id) },
      ],
    })
  }

  for (const holiday of upcomingBreaks(state.holidays, todayIso, 7)) {
    const key = `break:${holiday.key}:${holiday.start}`
    if (dismissed[key]) continue
    const underway = holiday.start <= todayIso
    cards.push({
      key,
      tone: 'bg-surface',
      kicker: underway
        ? t('today.holidayUntil', { day: friendlyDay(holiday.end) })
        : t('today.breakFrom', { day: daySpoken(holiday.start) }),
      title: holidayName(holiday),
      body: dayRange(holiday.start, holiday.end),
      actions: [{ label: t('today.gotIt'), kind: 'primary', run: dismiss(key) }],
    })
  }

  // One note a week. Six at once is a leaflet nobody finishes.
  const topic = topicOfTheWeek()
  const guideKey = `guide:${getISOWeek(today)}`
  if (!dismissed[guideKey]) {
    cards.push({
      key: guideKey,
      tone: 'bg-surface',
      kicker: t('guide.title'),
      title: t(`guide.${topic}.title`),
      body: <span className="line-clamp-3">{t(`guide.${topic}.body`)}</span>,
      actions: [
        { label: t('today.readMore'), kind: 'primary', run: () => navigate('/guide') },
        { label: t('today.gotIt'), kind: 'ghost', run: dismiss(guideKey) },
      ],
    })
  }

  const visible = cards.filter((card) => card.key !== leaving)
  const reduceMotion = useReducedMotion()

  function answer(card: StackCard, run: () => void) {
    if (reduceMotion) {
      run()
      return
    }
    setLeaving(card.key)
    window.setTimeout(() => {
      run()
      setLeaving(null)
    }, LEAVE_MS)
  }

  if (state.kids.length === 0) {
    return (
      <div className="space-y-8">
        <Greeting name={state.parents[me].name} />
        <EmptyState
          title={t('today.noKidsTitle')}
          body={t('today.noKidsBody')}
          action={
            <Link to="/kids">
              <Button variant="primary">{t('kids.addChild')}</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const end = fortnight[fortnight.length - 1].date

  return (
    <div className="relative">
      <Hug className="-left-[60px] top-[120px]" />
      <div className="relative z-[1]">
        <Greeting name={state.parents[me].name} />

        {/* The question the app exists to answer, written as a sentence. */}
        <h1 className="headline mt-[30px] text-hero">
          {withMe
            ? t('today.headWithYou')
            : tNode('today.headWith', { name: state.parents[assignment.parent].name })}
          {handover ? (
            <span className="block text-right">{t('today.headUntil', { day: daySpoken(handover.date) })}</span>
          ) : null}
        </h1>
        {handover ? (
          <p className="mt-3.5 max-w-[30ch] text-base leading-snug">
            {state.schedule.handoverPlace
              ? t('today.changeoverTimePlace', {
                  time: state.schedule.handoverTime,
                  place: state.schedule.handoverPlace,
                })
              : t('today.changeoverTime', { time: state.schedule.handoverTime })}{' '}
            {handover.parent === me
              ? t('today.thenYou')
              : t('today.thenThem', { name: state.parents[handover.parent].name })}
          </p>
        ) : null}
        {assignment.override ? (
          <p className="mt-2 text-sm text-muted">
            {assignment.override.reason
              ? t('today.changedByHandReason', { reason: assignment.override.reason })
              : t('today.changedByHand')}
          </p>
        ) : null}

        <div className="mt-[22px]">
          <Ribbon
            days={fortnight}
            todayIso={todayIso}
            describe={(stay) =>
              `${nameOf(state, stay.parent, t('common.you'))}, ${dayRange(
                stay.days[0].date,
                stay.days[stay.days.length - 1].date,
              )}`
            }
          />
          <div className="numeral mt-2 flex justify-between text-xs font-bold">
            <span>{t('date.today')}</span>
            <span>{t('today.next14')}</span>
            <span>{format(parseISO(end), 'd MMM', { locale: dates })}</span>
          </div>
        </div>

        {/* Everything that needs you, one card at a time. */}
        <section
          aria-label={t('today.stackCount', { count: visible.length })}
          className="mt-[30px] grid pt-11 [&>*]:[grid-area:1/1]"
        >
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-line px-6 text-center text-ui text-muted">
            <b className="headline text-[1.875rem] leading-none text-ink">{t('today.allDone')}</b>
            {t('today.allDoneBody')}
          </div>
          {cards.map((card) => {
            const isLeaving = card.key === leaving
            const depth = visible.indexOf(card)
            const shown = isLeaving || depth <= 2
            return (
              <article
                key={card.key}
                aria-hidden={depth !== 0}
                inert={depth !== 0}
                style={{
                  zIndex: isLeaving ? 20 : 10 - Math.max(depth, 0),
                  transform: isLeaving
                    ? 'translateX(120%) rotate(8deg)'
                    : `translateY(${-depth * 22}px) scale(${1 - depth * 0.05})`,
                  opacity: isLeaving || !shown ? 0 : 1,
                }}
                className={cx(
                  'relative flex min-h-[280px] flex-col rounded-card p-[22px] transition-[transform,opacity] duration-[450ms] ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none',
                  card.tone,
                )}
              >
                <span className="kicker pr-[52px]">{card.kicker}</span>
                <h3 className="wide mt-2 pr-[52px] text-display">{card.title}</h3>
                {card.body ? <p className="mt-2 text-ui">{card.body}</p> : null}
                {card.quote ? <p className="mt-2 text-ui italic">{card.quote}</p> : null}
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                  {card.actions.map((action) => (
                    <Button key={action.label} variant={action.kind} onClick={() => answer(card, action.run)}>
                      {action.label}
                    </Button>
                  ))}
                </div>
                {depth === 0 ? (
                  <span
                    aria-hidden
                    className="numeral absolute top-5 right-5 flex size-11 items-center justify-center rounded-full bg-surface/80 text-ui font-extrabold"
                  >
                    {visible.length}
                  </span>
                ) : null}
              </article>
            )
          })}
        </section>

        {/* Every change to the plan, visible to both homes. Below the stack,
            because it asks nothing of anyone. */}
        <section className="mt-10 rounded-card bg-surface p-[22px]">
          <h2 className="kicker">{t('changes.title')}</h2>
          {changes.length === 0 ? (
            <p className="mt-3 text-ui text-muted">{t('changes.none')}</p>
          ) : (
            <ul className="mt-1 divide-y-[1.5px] divide-line">
              {changes.map((change) => (
                <li key={change.id} className="py-3.5">
                  <p className="text-ui">{describe(change)}</p>
                  <p className="mt-0.5 text-sm text-muted">{daySpoken(change.at.slice(0, 10))}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function Greeting({ name }: { name: string }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5 leading-tight">
        <span
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sand font-extrabold"
        >
          {name.trim().charAt(0).toUpperCase() || '·'}
        </span>
        <span className="min-w-0 text-ui">
          {t('today.hi')}
          <b className="block truncate text-[1.0625rem]">{name}</b>
        </span>
      </div>
      <CircleButton label={t('nav.settings')} onClick={() => navigate('/settings')}>
        <IconMenu width={20} height={20} strokeWidth={2.5} />
      </CircleButton>
    </div>
  )
}

function useReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)'
  const [reduce, setReduce] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const list = window.matchMedia(query)
    const onChange = () => setReduce(list.matches)
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [])
  return reduce
}
