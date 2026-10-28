import { Fragment, useMemo, useState } from 'react'
import { parseISO } from 'date-fns'
import { useLocation } from 'react-router-dom'
import { IconPlus } from '../components/icons'
import { KidPicker } from './Calendar'
import {
  Bar,
  Button,
  CircleButton,
  EmptyState,
  Field,
  Hug,
  Segmented,
  Sheet,
  cx,
  homeStyles,
} from '../components/ui'
import { useI18n } from '../lib/i18n'
import {
  balanceView,
  formatMoney,
  owedOnExpense,
  paidTotals,
  parseAmountToCents,
  spendByCategory,
} from '../lib/money'
import { toISO } from '../lib/schedule'
import { nameOf, useApp } from '../lib/store'
import type { ExpenseCategory, ParentId } from '../lib/types'

const CATEGORIES: ExpenseCategory[] = [
  'childcare',
  'school',
  'health',
  'clothing',
  'activities',
  'travel',
  'food',
  'gifts',
  'other',
]

export default function Expenses() {
  const { state, actions, me, them } = useApp()
  const { t, friendlyDay, monthTitle, joinList } = useI18n()
  const location = useLocation()
  // Today's money card lands here with the payment form already open.
  const [sheet, setSheet] = useState<'none' | 'expense' | 'settle'>(() =>
    (location.state as { settle?: boolean } | null)?.settle ? 'settle' : 'none',
  )
  const [kidFilter, setKidFilter] = useState<string>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const expenses = useMemo(() => {
    const list =
      kidFilter === 'all'
        ? state.expenses
        : state.expenses.filter((e) => e.kidIds.includes(kidFilter))
    return [...list].sort((x, y) => y.date.localeCompare(x.date))
  }, [state.expenses, kidFilter])

  const balance = balanceView(state.expenses, state.settlements)
  const paid = paidTotals(state.expenses)
  const categories = spendByCategory(state.expenses).slice(0, 4)

  // Expenses and payments interleaved, so the running total stays auditable.
  const ledger = useMemo(() => {
    const entries = [
      ...expenses.map((e) => ({ kind: 'expense' as const, date: e.date, data: e })),
      ...(kidFilter === 'all'
        ? state.settlements.map((s) => ({ kind: 'settlement' as const, date: s.date, data: s }))
        : []),
    ]
    return entries.sort((x, y) => y.date.localeCompare(x.date))
  }, [expenses, state.settlements, kidFilter])

  // One block per month, newest first.
  const months = useMemo(() => {
    const groups: { month: string; entries: typeof ledger }[] = []
    for (const entry of ledger) {
      const month = entry.date.slice(0, 7)
      const last = groups[groups.length - 1]
      if (last && last.month === month) last.entries.push(entry)
      else groups.push({ month, entries: [entry] })
    }
    return groups
  }, [ledger])

  const kidNames = (ids: string[]) =>
    joinList(state.kids.filter((k) => ids.includes(k.id)).map((k) => k.name))

  /** The whole balance paid in one go, after asking. */
  function settleNow() {
    if (!balance.debtor || !balance.creditor) return
    if (!confirm(t('money.markSettledConfirm', { amount: formatMoney(balance.amountCents, state) }))) return
    actions.addSettlement({
      date: toISO(new Date()),
      from: balance.debtor,
      to: balance.creditor,
      amountCents: balance.amountCents,
      note: t('money.settledNote'),
    })
  }

  return (
    <div className="relative">
      <Hug className="-left-[60px] top-[60px]" />
      <div className="relative z-[1]">
        <Bar
          action={
            <CircleButton label={t('money.addExpense')} onClick={() => setSheet('expense')}>
              <IconPlus width={20} height={20} strokeWidth={2.5} />
            </CircleButton>
          }
        />

        {/* One number up top: the balance is the screen. */}
        {balance.debtor === null ? (
          <>
            <h1 className="headline mt-10 text-hero">{t('money.square')}</h1>
            <p className="mt-3.5 max-w-[30ch] text-base">{t('money.squareBody')}</p>
          </>
        ) : (
          <>
            <p className="mt-10 text-[1.0625rem] font-bold">
              {balance.debtor === me
                ? t('money.youOwe', { name: state.parents[them].name })
                : t('money.owesYou', { name: state.parents[them].name })}
            </p>
            <p className="headline numeral mt-2 text-mega">
              <Amount cents={balance.amountCents} />
            </p>
          </>
        )}
        <div className="mt-[22px] flex flex-wrap gap-2">
          {balance.debtor !== null ? (
            <>
              <Button variant="primary" onClick={() => setSheet('settle')}>
                {t('money.recordPayment')}
              </Button>
              <Button onClick={settleNow}>{t('money.markSettled')}</Button>
            </>
          ) : (
            <Button variant="primary" onClick={() => setSheet('expense')}>
              <IconPlus width={16} height={16} strokeWidth={2.5} />
              {t('money.addExpense')}
            </Button>
          )}
        </div>

        {state.kids.length > 1 ? (
          <div className="mt-10">
            <Segmented
              value={kidFilter}
              onChange={setKidFilter}
              options={[
                { value: 'all', label: t('common.everyone') },
                ...state.kids.map((kid) => ({ value: kid.id, label: kid.name })),
              ]}
            />
          </div>
        ) : null}

        {ledger.length === 0 ? (
          <div className="mt-10">
            <EmptyState title={t('money.noCostsTitle')} body={t('money.noCostsBody')} />
          </div>
        ) : (
          <div className={cx('space-y-3.5', state.kids.length > 1 ? 'mt-3.5' : 'mt-10')}>
            {months.map(({ month, entries }) => (
              <section key={month} className="rounded-card bg-surface p-[22px]">
                <h2 className="kicker">{monthTitle(parseISO(`${month}-01`))}</h2>
                <ul className="mt-1 divide-y-[1.5px] divide-line">
                  {entries.map((entry) => {
                    const open = expanded === entry.data.id
                    if (entry.kind === 'expense') {
                      const expense = entry.data
                      const mine = expense.paidBy === me
                      const kids = kidNames(expense.kidIds)
                      return (
                        <li key={expense.id}>
                          <button
                            type="button"
                            aria-expanded={open}
                            onClick={() => setExpanded(open ? null : expense.id)}
                            className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
                          >
                            <span className="min-w-0">
                              <b className="block truncate text-ui font-extrabold">{expense.title}</b>
                              <span className="block text-kicker text-muted">
                                {[
                                  kids,
                                  mine
                                    ? t('money.byYou')
                                    : t('money.byName', { name: state.parents[expense.paidBy].name }),
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </span>
                            </span>
                            <b className="numeral shrink-0 text-ui font-extrabold">
                              {mine ? '' : '−'}
                              {plainAmount(expense.amountCents, state.locale)}
                            </b>
                          </button>
                          {open ? (
                            <div className="-mt-1 space-y-1 pb-3.5 text-sm text-muted">
                              <p>
                                {friendlyDay(expense.date)}, {t(`category.${expense.category}`)}
                              </p>
                              <p>
                                {expense.payerSharePct === 50
                                  ? t('money.splitEvenly')
                                  : t('money.splitUneven', {
                                      payer: expense.payerSharePct,
                                      other: 100 - expense.payerSharePct,
                                    })}{' '}
                                {mine
                                  ? t('money.theyOwe', { name: state.parents[them].name })
                                  : t('money.youOweAmount')}{' '}
                                <span className="numeral font-bold text-ink">
                                  {formatMoney(owedOnExpense(expense), state)}
                                </span>
                              </p>
                              {expense.note ? <p>{expense.note}</p> : null}
                              <button
                                type="button"
                                onClick={() => actions.removeExpense(expense.id)}
                                className="pt-1 font-bold text-danger"
                              >
                                {t('common.remove')}
                              </button>
                            </div>
                          ) : null}
                        </li>
                      )
                    }
                    const settlement = entry.data
                    return (
                      <li key={settlement.id}>
                        <button
                          type="button"
                          aria-expanded={open}
                          onClick={() => setExpanded(open ? null : settlement.id)}
                          className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
                        >
                          <span className="min-w-0">
                            <b className="block text-ui font-extrabold">
                              {settlement.from === me
                                ? t('money.youPaidName', { name: state.parents[settlement.to].name })
                                : settlement.to === me
                                  ? t('money.namePaidYou', { name: state.parents[settlement.from].name })
                                  : t('money.namePaidName', {
                                      from: state.parents[settlement.from].name,
                                      to: state.parents[settlement.to].name,
                                    })}
                            </b>
                            <span className="block text-kicker text-muted">
                              {friendlyDay(settlement.date)}
                              {settlement.note ? ` · ${settlement.note}` : ''}
                            </span>
                          </span>
                          <b className="numeral shrink-0 text-ui font-extrabold">
                            {plainAmount(settlement.amountCents, state.locale)}
                          </b>
                        </button>
                        {open ? (
                          <div className="-mt-1 pb-3.5 text-sm">
                            <button
                              type="button"
                              onClick={() => actions.removeSettlement(settlement.id)}
                              className="font-bold text-danger"
                            >
                              {t('common.remove')}
                            </button>
                          </div>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}

        {state.expenses.length > 0 ? (
          <section className="mt-3.5 rounded-card bg-surface p-[22px]">
            <h2 className="kicker">{t('money.paidOut')}</h2>
            <ul className="mt-1 divide-y-[1.5px] divide-line text-ui">
              {(['a', 'b'] as ParentId[]).map((id) => (
                <li key={id} className="flex items-center justify-between gap-3 py-3.5">
                  <span className="flex items-center gap-2.5">
                    <span aria-hidden className={cx('size-3 rounded-full', homeStyles[id].solid)} />
                    {nameOf(state, id, t('common.you'))}
                  </span>
                  <b className="numeral font-extrabold">{formatMoney(paid[id], state)}</b>
                </li>
              ))}
            </ul>
            <h2 className="kicker mt-5">{t('money.biggestCategories')}</h2>
            <ul className="mt-1 divide-y-[1.5px] divide-line text-ui">
              {categories.map((entry) => (
                <li key={entry.category} className="flex items-center justify-between gap-3 py-3.5">
                  <span className="truncate">{t(`category.${entry.category}`)}</span>
                  <span className="numeral shrink-0 text-muted">{formatMoney(entry.cents, state)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <Sheet open={sheet === 'expense'} onClose={() => setSheet('none')} title={t('money.addExpense')}>
        <ExpenseForm onDone={() => setSheet('none')} />
      </Sheet>

      <Sheet open={sheet === 'settle'} onClose={() => setSheet('none')} title={t('money.recordPayment')}>
        <SettleForm onDone={() => setSheet('none')} />
      </Sheet>
    </div>
  )
}

/** The balance at headline size, with the currency set smaller beside it. */
function Amount({ cents }: { cents: number }) {
  const { state } = useApp()
  let parts: Intl.NumberFormatPart[]
  try {
    parts = new Intl.NumberFormat(state.locale, {
      style: 'currency',
      currency: state.currency,
      maximumFractionDigits: 2,
    }).formatToParts(cents / 100)
  } catch {
    // An unknown currency code: fall back to the plain formatted string.
    parts = [{ type: 'literal', value: formatMoney(cents, state) }]
  }
  return (
    <>
      {parts.map((part, index) =>
        part.type === 'currency' ? (
          <span key={index} className="text-[1.75rem] tracking-[-0.02em]">
            {part.value}
          </span>
        ) : (
          <Fragment key={index}>{part.value}</Fragment>
        ),
      )}
    </>
  )
}

/** A ledger amount without its currency: the block already says which. */
function plainAmount(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    cents / 100,
  )
}

function ExpenseForm({ onDone }: { onDone: () => void }) {
  const { state, actions, me } = useApp()
  const { t } = useI18n()
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => toISO(new Date()))
  const [category, setCategory] = useState<ExpenseCategory>('other')
  const [paidBy, setPaidBy] = useState<ParentId>(me)
  const [sharePct, setSharePct] = useState(50)
  const [kidIds, setKidIds] = useState<string[]>(state.kids.map((k) => k.id))
  const [note, setNote] = useState('')

  const cents = parseAmountToCents(amount)
  const owed = cents === null ? null : Math.round((cents * (100 - sharePct)) / 100)
  const otherName = state.parents[paidBy === 'a' ? 'b' : 'a'].name

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!title.trim() || cents === null || cents <= 0) return
        actions.addExpense({
          title: title.trim(),
          amountCents: cents,
          date,
          category,
          paidBy,
          payerSharePct: sharePct,
          kidIds,
          note: note.trim() || undefined,
        })
        onDone()
      }}
    >
      <Field label={t('money.whatFor')}>
        <input
          className="field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('money.whatForPlaceholder')}
          autoFocus
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t('money.amountIn', { currency: state.currency })}>
          <input
            className="field numeral"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="699,00"
          />
        </Field>
        <Field label={t('money.date')}>
          <input
            type="date"
            className="field"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
      </div>

      <Field label={t('money.category')}>
        <select
          className="field"
          value={category}
          onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
        >
          {CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {t(`category.${option}`)}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t('money.whoPaid')}>
        <Segmented<ParentId>
          value={paidBy}
          onChange={setPaidBy}
          options={[
            { value: 'a', label: state.parents.a.name },
            { value: 'b', label: state.parents.b.name },
          ]}
        />
      </Field>

      <Field
        label={t('money.split')}
        hint={
          owed === null
            ? t('money.splitHint')
            : t('money.splitOwes', { name: otherName, amount: formatMoney(owed, state) })
        }
      >
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={sharePct}
            onChange={(e) => setSharePct(Number(e.target.value))}
            className="flex-1 accent-[var(--color-ink)]"
          />
          <span className="numeral w-16 shrink-0 text-right text-sm">
            {sharePct}/{100 - sharePct}
          </span>
        </div>
      </Field>

      <Field label={t('money.whoFor')}>
        <KidPicker value={kidIds} onChange={setKidIds} />
      </Field>

      <Field label={t('money.note')}>
        <input
          className="field"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('money.notePlaceholder')}
        />
      </Field>

      <Button type="submit" variant="primary" block disabled={!title.trim() || !cents}>
        {t('money.addExpense')}
      </Button>
    </form>
  )
}

function SettleForm({ onDone }: { onDone: () => void }) {
  const { state, actions } = useApp()
  const { t } = useI18n()
  const balance = balanceView(state.expenses, state.settlements)
  const [amount, setAmount] = useState(() =>
    balance.amountCents ? (balance.amountCents / 100).toFixed(2) : '',
  )
  const [date, setDate] = useState(() => toISO(new Date()))
  const [note, setNote] = useState('')

  const cents = parseAmountToCents(amount)
  const from = balance.debtor ?? 'b'
  const to = balance.creditor ?? 'a'

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (cents === null || cents <= 0) return
        actions.addSettlement({ date, from, to, amountCents: cents, note: note.trim() || undefined })
        onDone()
      }}
    >
      <p className="text-sm text-muted">
        {t('money.settleExplainer', {
          from: state.parents[from].name,
          to: state.parents[to].name,
        })}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('money.amountIn', { currency: state.currency })}>
          <input
            className="field numeral"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
        </Field>
        <Field label={t('money.date')}>
          <input
            type="date"
            className="field"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
      </div>
      <Field label={t('money.howPaid')}>
        <input
          className="field"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('money.howPaidPlaceholder')}
        />
      </Field>
      <Button type="submit" variant="primary" block disabled={!cents}>
        {t('money.recordPaymentAction')}
      </Button>
    </form>
  )
}
