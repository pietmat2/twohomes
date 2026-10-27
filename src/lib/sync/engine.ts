import type { AppState, ParentId, SyncState } from '../types'
import { sanitizeRecord, sanitizeSingleton } from '../sanitize'

/**
 * How two homes stay in step without a server that can read anything.
 *
 * Every change on a device becomes an operation on one key — a record such as
 * `expenses/exp_1a2b3c4d`, or a singleton such as `schedule`. Each operation
 * carries a hybrid logical clock stamp, and for each key the highest stamp
 * wins. That rule gives the same answer whatever order operations arrive in,
 * however often one arrives, and whichever device applies it: both homes end
 * up with the same state.
 *
 * The existing actions don't know any of this. They change state as before;
 * `recordLocal` diffs the state before and after and turns the difference
 * into operations. Removals become tombstones, so a deleted record stays
 * deleted rather than being resurrected by the other home's older copy.
 */

/** Wall-clock milliseconds, a counter for ties, and the device as a last tie-break. */
export interface Stamp {
  t: number
  c: number
  d: string
}

export interface Op {
  id: string
  stamp: Stamp
  /** Which parent made it. Checked against the signature on arrival. */
  author: ParentId
  /** `member` introduces a device's public key; it is the first op each device sends. */
  kind: 'put' | 'del' | 'member'
  key: string
  value?: unknown
}

export const COLLECTIONS = [
  'overrides',
  'swaps',
  'kids',
  'expenses',
  'settlements',
  'events',
  'bag',
  'moments',
] as const
export type Collection = (typeof COLLECTIONS)[number]

/** Shared by both homes. Language, theme and which parent this is stay per device. */
export const SINGLETONS = ['parents/a', 'parents/b', 'schedule', 'currency'] as const
type Singleton = (typeof SINGLETONS)[number]

/** New records in these go first, the way the actions add them locally. */
const PREPENDED = new Set<Collection>(['swaps', 'expenses', 'settlements', 'moments'])

type Keyed = { id: string; date?: string }

/**
 * A day can only be with one home, so overrides are keyed by date: two
 * parents moving the same day converge on one answer instead of two records.
 */
function recordKey(collection: Collection, record: Keyed): string {
  return collection === 'overrides' ? (record.date ?? record.id) : record.id
}

export function compareStamps(x: Stamp, y: Stamp): number {
  return x.t - y.t || x.c - y.c || (x.d < y.d ? -1 : x.d > y.d ? 1 : 0)
}

/** The next stamp on this device: never behind anything it has seen. */
export function tick(clock: SyncState['clock'], device: string, now = Date.now()): Stamp {
  const t = Math.max(now, clock.t)
  return { t, c: t === clock.t ? clock.c + 1 : 0, d: device }
}

function observe(clock: SyncState['clock'], stamp: Stamp): SyncState['clock'] {
  return stamp.t > clock.t || (stamp.t === clock.t && stamp.c > clock.c)
    ? { t: stamp.t, c: stamp.c }
    : clock
}

function singleton(state: AppState, key: Singleton): unknown {
  switch (key) {
    case 'parents/a':
      return state.parents.a
    case 'parents/b':
      return state.parents.b
    case 'schedule':
      return state.schedule
    case 'currency':
      return state.currency
  }
}

const same = (x: unknown, y: unknown) => x === y || JSON.stringify(x) === JSON.stringify(y)

export interface Change {
  key: string
  kind: 'put' | 'del'
  value?: unknown
}

/** Every shared key that differs between two states. */
export function diff(prev: AppState, next: AppState): Change[] {
  const changes: Change[] = []
  for (const key of SINGLETONS) {
    const value = singleton(next, key)
    if (!same(singleton(prev, key), value)) changes.push({ key, kind: 'put', value })
  }
  for (const collection of COLLECTIONS) {
    const before = prev[collection] as Keyed[]
    const after = next[collection] as Keyed[]
    if (before === after) continue
    const old = new Map(before.map((r) => [recordKey(collection, r), r]))
    const seen = new Set<string>()
    for (const record of after) {
      const key = recordKey(collection, record)
      seen.add(key)
      const was = old.get(key)
      // Unchanged records keep their reference, so most need no comparing.
      if (was !== record && (!was || !same(was, record))) {
        changes.push({ key: `${collection}/${key}`, kind: 'put', value: record })
      }
    }
    for (const key of old.keys()) {
      if (!seen.has(key)) changes.push({ key: `${collection}/${key}`, kind: 'del' })
    }
  }
  return changes
}

function newOpId(): string {
  return crypto.randomUUID()
}

/**
 * Wraps a local change: the state as the action left it, plus the operations
 * that describe it, queued to send. A device that isn't sharing gets `next`
 * back untouched.
 */
export function recordLocal(prev: AppState, next: AppState): AppState {
  const sync = next.sync
  if (!sync) return next
  const changes = diff(prev, next)
  if (changes.length === 0) return next
  return { ...next, sync: queue(sync, next.me, changes) }
}

function queue(sync: SyncState, author: ParentId, changes: Change[]): SyncState {
  let clock = sync.clock
  const meta = { ...sync.meta }
  const ops: Op[] = changes.map((change) => {
    const stamp = tick(clock, sync.device)
    clock = { t: stamp.t, c: stamp.c }
    meta[change.key] = stamp
    return { id: newOpId(), stamp, author, kind: change.kind, key: change.key, value: change.value }
  })
  return { ...sync, clock, meta, outbox: [...sync.outbox, ...ops] }
}

/** Everything shared, as operations: what a new family starts from. */
export function snapshot(state: AppState): Change[] {
  const changes: Change[] = SINGLETONS.map((key) => ({ key, kind: 'put' as const, value: singleton(state, key) }))
  for (const collection of COLLECTIONS) {
    for (const record of state[collection] as Keyed[]) {
      changes.push({ key: `${collection}/${recordKey(collection, record)}`, kind: 'put', value: record })
    }
  }
  return changes
}

/** Queue the whole shared state, for the device that starts a family. */
export function queueSnapshot(state: AppState): AppState {
  if (!state.sync) return state
  return { ...state, sync: queue(state.sync, state.me, snapshot(state)) }
}

/** The op a device introduces itself with. */
export function memberOp(sync: SyncState, author: ParentId): Op {
  const stamp = tick(sync.clock, sync.device)
  return { id: newOpId(), stamp, author, kind: 'member', key: `member/${author}`, value: { publicKey: sync.signing.publicKey } }
}

/** The op a device leaves with, so the other home stops showing it as in step. */
export function leaveOp(sync: SyncState, author: ParentId): Op {
  const stamp = tick(sync.clock, sync.device)
  return { id: newOpId(), stamp, author, kind: 'member', key: `member/${author}`, value: { left: true } }
}

/** What a member op says: a key introduced, or a device gone. */
export function memberChange(op: Op): { publicKey?: JsonWebKey; left?: boolean } {
  return (op.value ?? {}) as { publicKey?: JsonWebKey; left?: boolean }
}

/**
 * Apply operations from the other home. Each one lands only if its stamp beats
 * what this device already has for that key; anything malformed is dropped,
 * the same way an import is checked.
 */
export function applyRemote(state: AppState, ops: Op[]): AppState {
  const sync = state.sync
  if (!sync) return state
  let next: AppState = state
  let clock = sync.clock
  const meta = { ...sync.meta }
  const peers = { ...sync.peers }

  for (const op of ops) {
    clock = observe(clock, op.stamp)
    if (op.kind === 'member') {
      const { publicKey, left } = memberChange(op)
      if (left) delete peers[op.author]
      else if (publicKey && !peers[op.author]) peers[op.author] = publicKey
      continue
    }
    const current = meta[op.key]
    if (current && compareStamps(current, op.stamp) >= 0) continue
    const applied = applyOne(next, op)
    if (!applied) continue
    meta[op.key] = op.stamp
    next = applied
  }

  return { ...next, sync: { ...sync, clock, meta, peers } }
}

function applyOne(state: AppState, op: Op): AppState | null {
  const slash = op.key.indexOf('/')
  const head = slash === -1 ? op.key : op.key.slice(0, slash)
  const rest = slash === -1 ? '' : op.key.slice(slash + 1)

  if ((SINGLETONS as readonly string[]).includes(op.key)) {
    if (op.kind !== 'put') return null
    const value = sanitizeSingleton(op.key as Singleton, op.value)
    if (value === null) return null
    if (op.key === 'schedule') return { ...state, schedule: value as AppState['schedule'] }
    if (op.key === 'currency') return { ...state, currency: value as string }
    const id = op.key === 'parents/a' ? 'a' : 'b'
    return { ...state, parents: { ...state.parents, [id]: value as AppState['parents']['a'] } }
  }

  if (!(COLLECTIONS as readonly string[]).includes(head) || !rest) return null
  const collection = head as Collection
  const list = state[collection] as Keyed[]
  const kept = list.filter((r) => recordKey(collection, r) !== rest)
  if (op.kind === 'del') return { ...state, [collection]: kept }

  const record = sanitizeRecord(collection, op.value) as Keyed | null
  if (!record || recordKey(collection, record) !== rest) return null
  const index = list.findIndex((r) => recordKey(collection, r) === rest)
  const updated =
    index >= 0
      ? list.map((r, i) => (i === index ? record : r))
      : PREPENDED.has(collection)
        ? [record, ...kept]
        : [...kept, record]
  return { ...state, [collection]: updated }
}

/** Both parents have introduced a device. */
export function isPaired(sync: SyncState | undefined): boolean {
  return Boolean(sync?.peers.a && sync?.peers.b)
}
