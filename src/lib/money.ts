import type { AppState, Expense, ExpenseCategory, ParentId, Settlement } from './types'

/** What the other home owes the payer for a single expense. */
export function owedOnExpense(expense: Expense): number {
  const pct = Math.min(100, Math.max(0, expense.payerSharePct))
  return Math.round((expense.amountCents * (100 - pct)) / 100)
}

/**
 * The running balance, in cents, expressed from A's side:
 * positive means B owes A, negative means A owes B.
 */
export function balanceCents(expenses: Expense[], settlements: Settlement[]): number {
  let balance = 0
  for (const expense of expenses) {
    const owed = owedOnExpense(expense)
    balance += expense.paidBy === 'a' ? owed : -owed
  }
  for (const settlement of settlements) {
    // Money moving from B to A pays down what B owes.
    balance += settlement.from === 'b' ? -settlement.amountCents : settlement.amountCents
  }
  return balance
}

export interface BalanceView {
  /** Signed from A's side, as above. */
  raw: number
  /** Who is behind, or null when the ledger is square. */
  debtor: ParentId | null
  creditor: ParentId | null
  amountCents: number
}

export function balanceView(expenses: Expense[], settlements: Settlement[]): BalanceView {
  const raw = balanceCents(expenses, settlements)
  if (raw === 0) return { raw, debtor: null, creditor: null, amountCents: 0 }
  return raw > 0
    ? { raw, debtor: 'b', creditor: 'a', amountCents: raw }
    : { raw, debtor: 'a', creditor: 'b', amountCents: -raw }
}

/** Total each home has actually paid out over a set of expenses. */
export function paidTotals(expenses: Expense[]): Record<ParentId, number> {
  return expenses.reduce(
    (totals, expense) => {
      totals[expense.paidBy] += expense.amountCents
      return totals
    },
    { a: 0, b: 0 } as Record<ParentId, number>,
  )
}

export function spendByCategory(
  expenses: Expense[],
): { category: ExpenseCategory; cents: number }[] {
  const map = new Map<ExpenseCategory, number>()
  for (const expense of expenses) {
    map.set(expense.category, (map.get(expense.category) ?? 0) + expense.amountCents)
  }
  return [...map.entries()]
    .map(([category, cents]) => ({ category, cents }))
    .sort((x, y) => y.cents - x.cents)
}

export function formatMoney(cents: number, state: Pick<AppState, 'currency' | 'locale'>): string {
  try {
    return new Intl.NumberFormat(state.locale, {
      style: 'currency',
      currency: state.currency,
      maximumFractionDigits: 2,
    }).format(cents / 100)
  } catch {
    return `${(cents / 100).toFixed(2)} ${state.currency}`
  }
}

/** Parse a typed amount ("129", "129,50", "1.299,00") into cents. */
export function parseAmountToCents(input: string): number | null {
  const cleaned = input.trim().replace(/[^\d.,-]/g, '')
  if (!cleaned) return null
  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')
  let normalised = cleaned
  if (lastComma > -1 && lastComma > lastDot) {
    // Comma is the decimal separator, so dots are thousands separators.
    normalised = cleaned.replace(/\./g, '').replace(',', '.')
  } else {
    normalised = cleaned.replace(/,/g, '')
  }
  const value = Number.parseFloat(normalised)
  if (!Number.isFinite(value)) return null
  return Math.round(value * 100)
}
