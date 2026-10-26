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
import { friendlyDay } from '../lib/format'
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

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'childcare', label: 'Childcare' },
  { value: 'school', label: 'School' },
  { value: 'health', label: 'Health' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'activities', label: 'Activities' },
  { value: 'travel', label: 'Travel' },
  { value: 'food', label: 'Food' },
  { value: 'gifts', label: 'Gifts' },
  { value: 'other', label: 'Other' },
]

const categoryLabel = (value: string) => CATEGORIES.find((c) => c.value === value)?.label ?? 'Other'

export default function Expenses() {
  const { state, actions, me, them } = useApp()
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
              You&rsquo;re square
            </h1>
            <p className="mt-1 text-sm text-muted">Nothing is outstanding between the two homes.</p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">
              {balance.debtor === me
                ? `You owe ${state.parents[them].name}`
                : `${state.parents[them].name} owes you`}
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
            Add expense
          </Button>
          {balance.debtor !== null ? (
            <Button size="sm" onClick={() => setSheet('settle')}>
              Record a payment
            </Button>
          ) : null}
        </div>
      </section>

      {state.expenses.length > 0 ? (
        <section className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm text-muted">Paid out so far</p>
            <div className="space-y-2">
              {(['a', 'b'] as ParentId[]).map((id) => {
                const share = totalSpend === 0 ? 0 : Math.round((paid[id] / totalSpend) * 100)
                return (
                  <div key={id}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span>{nameOf(state, id)}</span>
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
            <p className="mb-2 text-sm text-muted">Biggest categories</p>
            <ul className="space-y-1.5 text-sm">
              {categories.map((entry) => (
                <li key={entry.category} className="flex items-baseline justify-between gap-2">
                  <span className="truncate">{categoryLabel(entry.category)}</span>
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
            { value: 'all', label: 'Everyone' },
            ...state.kids.map((kid) => ({ value: kid.id, label: kid.name })),
          ]}
        />
      ) : null}

      <section>
        <SectionTitle>Ledger</SectionTitle>
        {ledger.length === 0 ? (
          <EmptyState
            title="No costs logged yet"
            body="Add the first shared expense and the balance keeps itself up to date."
            action={
              <Button variant="primary" size="sm" onClick={() => setSheet('expense')}>
                Add expense
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
                      {nameOf(state, entry.data.paidBy)} paid, {friendlyDay(entry.data.date)}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {entry.data.payerSharePct === 50
                        ? 'Split evenly, so '
                        : `Split ${entry.data.payerSharePct}/${100 - entry.data.payerSharePct}, so `}
                      {entry.data.paidBy === me
                        ? `${state.parents[them].name} owes `
                        : 'you owe '}
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
                      Remove
                    </button>
                  </div>
                </Row>
              ) : (
                <Row key={entry.data.id}>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.9375rem]">
                      {entry.data.from === me
                        ? `You paid ${state.parents[entry.data.to].name}`
                        : `${state.parents[entry.data.from].name} paid ${
                            entry.data.to === me ? 'you' : state.parents[entry.data.to].name
                          }`}
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
                      Remove
                    </button>
                  </div>
                </Row>
              ),
            )}
          </Rows>
        )}
      </section>

      <Sheet open={sheet === 'expense'} onClose={() => setSheet('none')} title="Add an expense">
        <ExpenseForm onDone={() => setSheet('none')} />
      </Sheet>

      <Sheet open={sheet === 'settle'} onClose={() => setSheet('none')} title="Record a payment">
        <SettleForm onDone={() => setSheet('none')} />
      </Sheet>
    </div>
  )
}

function ExpenseForm({ onDone }: { onDone: () => void }) {
  const { state, actions, me } = useApp()
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
      <Field label="What was it for">
        <input
          className="field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Winter boots"
          autoFocus
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={`Amount in ${state.currency}`}>
          <input
            className="field numeral"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="699,00"
          />
        </Field>
        <Field label="Date">
          <input
            type="date"
            className="field"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
      </div>

      <Field label="Category">
        <select
          className="field"
          value={category}
          onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
        >
          {CATEGORIES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Who paid">
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
        label="Split"
        hint={
          owed === null
            ? 'The payer carries the first share, the other home owes the rest.'
            : `${otherName} owes ${formatMoney(owed, state)}.`
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

      <Field label="Who it is for">
        <KidPicker value={kidIds} onChange={setKidIds} />
      </Field>

      <Field label="Note">
        <input
          className="field"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Receipt in the shared folder"
        />
      </Field>

      <Button type="submit" variant="primary" block disabled={!title.trim() || !cents}>
        Add expense
      </Button>
    </form>
  )
}

function SettleForm({ onDone }: { onDone: () => void }) {
  const { state, actions } = useApp()
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
        This records money that already moved from {state.parents[from].name} to{' '}
        {state.parents[to].name}. Twohomes does not move money itself.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field label={`Amount in ${state.currency}`}>
          <input
            className="field numeral"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
        </Field>
        <Field label="Date">
          <input
            type="date"
            className="field"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
      </div>
      <Field label="How it was paid">
        <input
          className="field"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="MobilePay"
        />
      </Field>
      <Button type="submit" variant="primary" block disabled={!cents}>
        Record payment
      </Button>
    </form>
  )
}
