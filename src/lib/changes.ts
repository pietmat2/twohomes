import type { AppState, ParentId } from './types'

/**
 * Everything that has moved the schedule since the pattern was set, in one
 * list. Separated parents spend a lot of energy asking "did you change
 * Thursday?"; the answer should simply be on the screen, attributed and
 * dated, in language that does not take a side.
 */
export type ChangeEntry =
  | {
      id: string
      at: string
      kind: 'moved'
      date: string
      parent: ParentId
      by?: ParentId
      reason?: string
    }
  | {
      id: string
      at: string
      kind: 'asked' | 'agreed' | 'declined'
      dates: string[]
      by: ParentId
    }

export function recentChanges(state: AppState, limit = 6): ChangeEntry[] {
  const entries: ChangeEntry[] = []

  for (const override of state.overrides) {
    // A swap already describes itself; listing the days it moved as well
    // would report the same event twice.
    if (override.source === 'swap') continue
    entries.push({
      id: override.id,
      at: override.createdAt,
      kind: 'moved',
      date: override.date,
      parent: override.parent,
      by: override.by,
      reason: override.reason,
    })
  }

  for (const swap of state.swaps) {
    if (swap.status === 'pending') {
      entries.push({ id: swap.id, at: swap.createdAt, kind: 'asked', dates: swap.dates, by: swap.from })
    } else {
      entries.push({
        id: swap.id,
        at: swap.respondedAt ?? swap.createdAt,
        kind: swap.status === 'accepted' ? 'agreed' : 'declined',
        dates: swap.dates,
        by: swap.to,
      })
    }
  }

  return entries.sort((x, y) => y.at.localeCompare(x.at)).slice(0, limit)
}
