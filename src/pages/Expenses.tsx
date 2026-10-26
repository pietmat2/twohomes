import { useMemo, useState } from 'react'
import { IconPlus } from '../components/icons'
import { KidPicker } from './Calendar'
import {
  Button,
  EmptyState,
  Field,
  Row,
  Rows,
  SectionTitle,
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
  const { t, friendlyDay } = useI18n()
  const [sheet, setSheet] = useState<'none' | 'expense' | 'settle'>('none')
  const [kidFilter, setKidFilter] = useState<string>('all')

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
  const totalSpend = state.expenses.reduce((sum, e) => sum + e.amountCents, 0)

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

  return (
    <div className="space-y-7">
      <section>
        {balance.debtor === null ? (
          <>
            <h1 className="font-display text-[2rem] leading-tight font-semibold">
              {t('money.square')}
            </h1>
            <p className="mt-1 text-sm text-muted">{t('money.squareBody')}</p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">
              {balance.debtor === me
                ? t('money.youOwe', { name: state.parents[them].name })
                : t('money.owesYou', { name: state.parents[them].name })}
            </p>
            <h1
              className={cx(
                'numeral mt-1 text-[2.5rem] leading-none font-semibold',
                balance.creditor ? homeStyles[balance.creditor].text : '',
              )}
            >
              {formatMoney(balance.amountCents, state)}
            </h1>
          </>
        )}
        <div className="mt-4 flex gap-2">
          <Button variant="primary" size="sm" onClick={() => setSheet('expense')}>
            <IconPlus width={15} height={15} />
            {t('money.addExpense')}
          </Button>
          {balance.debtor !== null ? (
            <Button size="sm" onClick={() => setSheet('settle')}>
              {t('money.recordPayment')}
            </Button>
          ) : null}
        </div>
      </section>

      {state.expenses.length > 0 ? (
        <section className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm text-muted">{t('money.paidOut')}</p>
            <div className="space-y-2">
              {(['a', 'b'] as ParentId[]).map((id) => {
                const share = totalSpend === 0 ? 0 : Math.round((paid[id] / totalSpend) * 100)
                return (
                  <div key={id}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span>{nameOf(state, id, t('common.you'))}</span>
                      <span className="numeral">{formatMoney(paid[id], state)}</span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-sunken">
                      <div
                        className={cx('h-full rounded-full', homeStyles[id].solid)}
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm text-muted">{t('money.biggestCategories')}</p>
            <ul className="space-y-1.5 text-sm">
              {categories.map((entry) => (
                <li key={entry.category} className="flex items-baseline justify-between gap-2">
                  <span className="truncate">{t(`category.${entry.category}`)}</span>
                  <span className="numeral shrink-0 text-muted">
                    {formatMoney(entry.cents, state)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {state.kids.length > 1 ? (
        <Segmented
          value={kidFilter}
          onChange={setKidFilter}
          options={[
            { value: 'all', label: t('common.everyone') },
            ...state.kids.map((kid) => ({ value: kid.id, label: kid.name })),
          ]}
        />
      ) : null}

      <section>
        <SectionTitle>{t('money.ledger')}</SectionTitle>
        {ledger.length === 0 ? (
          <EmptyState
            title={t('money.noCostsTitle')}
            body={t('money.noCostsBody')}
            action={
              <Button variant="primary" size="sm" onClick={() => setSheet('expense')}>
                {t('money.addExpense')}
              </Button>
            }
          />
        ) : (
          <Rows>
            {ledger.map((entry) =>
              entry.kind === 'expense' ? (
                <Row key={entry.data.id}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.9375rem] font-medium">{entry.data.title}</p>
                    <p className="mt-0.5 text-sm text-muted">
                      {entry.data.paidBy === me
                        ? t('money.youPaidOn', { day: friendlyDay(entry.data.date) })
                        : t('money.paidOn', {
                            name: state.parents[entry.data.paidBy].name,
                            day: friendlyDay(entry.data.date),
                          })}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {entry.data.payerSharePct === 50
                        ? t('money.splitEvenly')
                        : t('money.splitUneven', {
                            payer: entry.data.payerSharePct,
                            other: 100 - entry.data.payerSharePct,
                          })}{' '}
                      {entry.data.paidBy === me
                        ? t('money.theyOwe', { name: state.parents[them].name })
                        : t('money.youOweAmount')}{' '}
                      <span className="numeral text-ink">
                        {formatMoney(owedOnExpense(entry.data), state)}
                      </span>
                    </p>
                    {entry.data.note ? (
                      <p className="mt-1 text-sm text-faint">{entry.data.note}</p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="numeral text-[0.9375rem] font-semibold">
                      {formatMoney(entry.data.amountCents, state)}
                    </p>
                    <button
                      type="button"
                      onClick={() => actions.removeExpense(entry.data.id)}
                      className="mt-1 text-sm text-faint hover:text-danger"
                    >
                      {t('common.remove')}
                    </button>
                  </div>
                </Row>
              ) : (
                <Row key={entry.data.id}>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.9375rem]">
                      {entry.data.from === me
                        ? t('money.youPaidName', { name: state.parents[entry.data.to].name })
                        : entry.data.to === me
                          ? t('money.namePaidYou', { name: state.parents[entry.data.from].name })
                          : t('money.namePaidName', {
                              from: state.parents[entry.data.from].name,
                              to: state.parents[entry.data.to].name,
                            })}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">
                      {friendlyDay(entry.data.date)}
                      {entry.data.note ? `, ${entry.data.note}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="numeral text-[0.9375rem] font-semibold text-positive">
                      {formatMoney(entry.data.amountCents, state)}
                    </p>
                    <button
                      type="button"
                      onClick={() => actions.removeSettlement(entry.data.id)}
                      className="mt-1 text-sm text-faint hover:text-danger"
                    >
                      {t('common.remove')}
                    </button>
                  </div>
                </Row>
              ),
            )}
          </Rows>
        )}
      </section>

      <Sheet
        open={sheet === 'expense'}
        onClose={() => setSheet('none')}
        title={t('money.addExpense')}
      >
        <ExpenseForm onDone={() => setSheet('none')} />
      </Sheet>

      <Sheet
        open={sheet === 'settle'}
        onClose={() => setSheet('none')}
        title={t('money.recordPayment')}
      >
        <SettleForm onDone={() => setSheet('none')} />
      </Sheet>
    </div>
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
