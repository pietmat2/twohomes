import { isLang, localeOf } from './i18n-locale'
import { PATTERNS } from './schedule'
import { STATE_VERSION } from './storage'
import type { Collection } from './sync/engine'
import type {
  AppState,
  BagItem,
  DayOverride,
  EventType,
  Expense,
  ExpenseCategory,
  Kid,
  KidEvent,
  Moment,
  Parent,
  ParentId,
  ScheduleConfig,
  Settlement,
  SwapRequest,
} from './types'

/**
 * The trust boundary for anything that did not come from this app's own
 * storage — today, an imported file. An export can be edited by hand or
 * crafted by someone else, so nothing in it is taken as given: every record is
 * rebuilt field by field, unknown fields are dropped, enums are checked, and a
 * photo must be an image data URL and nothing else.
 *
 * Returns null when the file isn't recognisably a Twohomes state at all.
 */
export function sanitizeState(input: unknown): AppState | null {
  const raw = obj(input)
  if (!raw) return null
  const parents = obj(raw.parents)
  const schedule = sanitizeSchedule(raw.schedule)
  const a = parents && sanitizeParent(parents.a, 'a')
  const b = parents && sanitizeParent(parents.b, 'b')
  if (!a || !b || !schedule) return null

  const language = isLang(raw.language) ? raw.language : 'en'
  return {
    version: STATE_VERSION,
    me: parentId(raw.me) ?? 'a',
    parents: { a, b },
    language,
    locale: localeOf(language),
    currency: typeof raw.currency === 'string' && /^[A-Z]{3}$/.test(raw.currency) ? raw.currency : 'EUR',
    theme: raw.theme === 'light' || raw.theme === 'dark' ? raw.theme : 'system',
    schedule,
    overrides: list(raw.overrides, sanitizeOverride),
    swaps: list(raw.swaps, sanitizeSwap),
    kids: list(raw.kids, sanitizeKid),
    expenses: list(raw.expenses, sanitizeExpense),
    settlements: list(raw.settlements, sanitizeSettlement),
    events: list(raw.events, sanitizeEvent),
    bag: list(raw.bag, sanitizeBagItem),
    moments: list(raw.moments, sanitizeMoment),
  }
}

type Raw = Record<string, unknown>

/**
 * One record from the other home, checked the same way as an import: an
 * operation is signed by the other parent's device, but it is still input
 * this device didn't write.
 */
export function sanitizeRecord(collection: Collection, value: unknown): unknown {
  const raw = obj(value)
  if (!raw) return null
  switch (collection) {
    case 'overrides':
      return sanitizeOverride(raw)
    case 'swaps':
      return sanitizeSwap(raw)
    case 'kids':
      return sanitizeKid(raw)
    case 'expenses':
      return sanitizeExpense(raw)
    case 'settlements':
      return sanitizeSettlement(raw)
    case 'events':
      return sanitizeEvent(raw)
    case 'bag':
      return sanitizeBagItem(raw)
    case 'moments':
      return sanitizeMoment(raw)
  }
}

export function sanitizeSingleton(
  key: 'parents/a' | 'parents/b' | 'schedule' | 'currency',
  value: unknown,
): unknown {
  if (key === 'schedule') return sanitizeSchedule(value)
  if (key === 'currency') return typeof value === 'string' && /^[A-Z]{3}$/.test(value) ? value : null
  return sanitizeParent(value, key === 'parents/a' ? 'a' : 'b')
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'childcare', 'school', 'health', 'clothing', 'activities', 'travel', 'food', 'gifts', 'other',
]
const EVENT_TYPES: EventType[] = ['school', 'medical', 'activity', 'birthday', 'other']

/** A JPEG, PNG or WebP as base64, the only thing the photo slot may hold. */
const PHOTO = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/
const DATE = /^\d{4}-\d{2}-\d{2}$/
const TIME = /^\d{2}:\d{2}$/

function obj(value: unknown): Raw | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Raw) : null
}

function list<T>(value: unknown, item: (raw: Raw) => T | null): T[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    const raw = obj(entry)
    const clean = raw && item(raw)
    return clean ? [clean] : []
  })
}

/** Long enough for any real note, short enough that a hostile file can't balloon. */
function text(value: unknown, max = 2000): string | undefined {
  return typeof value === 'string' ? value.slice(0, max) : undefined
}

function id(value: unknown): string | null {
  return typeof value === 'string' && /^[\w-]{1,64}$/.test(value) ? value : null
}

function date(value: unknown): string | null {
  return typeof value === 'string' && DATE.test(value) ? value : null
}

function timestamp(value: unknown): string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
    ? value
    : new Date().toISOString()
}

function parentId(value: unknown): ParentId | null {
  return value === 'a' || value === 'b' ? value : null
}

function ids(value: unknown): string[] {
  return Array.isArray(value) ? value.flatMap((x) => (id(x) ? [x as string] : [])) : []
}

function cents(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null
}

function sanitizeParent(value: unknown, which: ParentId): Parent | null {
  const raw = obj(value)
  if (!raw) return null
  // Only what the app shows. Contact details were never collected, so an
  // import doesn't get to add them.
  return { id: which, name: text(raw.name, 80) ?? '', homeName: text(raw.homeName, 80) ?? '' }
}

function sanitizeSchedule(value: unknown): ScheduleConfig | null {
  const raw = obj(value)
  const pattern = raw && PATTERNS.find((p) => p.id === raw.patternId)
  const anchorDate = raw && date(raw.anchorDate)
  if (!raw || !pattern || !anchorDate) return null
  return {
    patternId: pattern.id,
    anchorDate,
    startParent: parentId(raw.startParent) ?? 'a',
    handoverTime: typeof raw.handoverTime === 'string' && TIME.test(raw.handoverTime) ? raw.handoverTime : '17:00',
    handoverPlace: text(raw.handoverPlace, 200),
  }
}

function sanitizeOverride(raw: Raw): DayOverride | null {
  const key = id(raw.id)
  const day = date(raw.date)
  const parent = parentId(raw.parent)
  if (!key || !day || !parent) return null
  return {
    id: key,
    date: day,
    parent,
    reason: text(raw.reason, 500),
    createdAt: timestamp(raw.createdAt),
    by: parentId(raw.by) ?? undefined,
    source: raw.source === 'swap' || raw.source === 'manual' ? raw.source : undefined,
  }
}

function sanitizeSwap(raw: Raw): SwapRequest | null {
  const key = id(raw.id)
  const from = parentId(raw.from)
  const dates = Array.isArray(raw.dates) ? raw.dates.flatMap((d) => (date(d) ? [d as string] : [])) : []
  if (!key || !from || dates.length === 0) return null
  const status = raw.status === 'accepted' || raw.status === 'declined' ? raw.status : 'pending'
  return {
    id: key,
    dates,
    from,
    to: from === 'a' ? 'b' : 'a',
    message: text(raw.message, 1000),
    status,
    createdAt: timestamp(raw.createdAt),
    respondedAt: typeof raw.respondedAt === 'string' ? timestamp(raw.respondedAt) : undefined,
    responseNote: text(raw.responseNote, 1000),
  }
}

function sanitizeKid(raw: Raw): Kid | null {
  const key = id(raw.id)
  if (!key) return null
  return {
    id: key,
    name: text(raw.name, 80) ?? '',
    birthdate: date(raw.birthdate) ?? undefined,
    emoji: text(raw.emoji, 8),
    school: text(raw.school, 200),
    doctor: text(raw.doctor, 200),
    allergies: text(raw.allergies, 1000),
    notes: text(raw.notes),
  }
}

function sanitizeExpense(raw: Raw): Expense | null {
  const key = id(raw.id)
  const day = date(raw.date)
  const amountCents = cents(raw.amountCents)
  const paidBy = parentId(raw.paidBy)
  const share = typeof raw.payerSharePct === 'number' ? raw.payerSharePct : 50
  if (!key || !day || amountCents === null || !paidBy) return null
  return {
    id: key,
    date: day,
    title: text(raw.title, 200) ?? '',
    amountCents,
    category: EXPENSE_CATEGORIES.find((c) => c === raw.category) ?? 'other',
    paidBy,
    payerSharePct: Math.min(100, Math.max(0, share)),
    kidIds: ids(raw.kidIds),
    note: text(raw.note, 1000),
    createdAt: timestamp(raw.createdAt),
  }
}

function sanitizeSettlement(raw: Raw): Settlement | null {
  const key = id(raw.id)
  const day = date(raw.date)
  const from = parentId(raw.from)
  const amountCents = cents(raw.amountCents)
  if (!key || !day || !from || amountCents === null) return null
  return {
    id: key,
    date: day,
    from,
    to: from === 'a' ? 'b' : 'a',
    amountCents,
    note: text(raw.note, 1000),
    createdAt: timestamp(raw.createdAt),
  }
}

function sanitizeEvent(raw: Raw): KidEvent | null {
  const key = id(raw.id)
  const day = date(raw.date)
  if (!key || !day) return null
  return {
    id: key,
    date: day,
    time: typeof raw.time === 'string' && TIME.test(raw.time) ? raw.time : undefined,
    title: text(raw.title, 200) ?? '',
    type: EVENT_TYPES.find((t) => t === raw.type) ?? 'other',
    kidIds: ids(raw.kidIds),
    location: text(raw.location, 200),
    note: text(raw.note, 1000),
    owner: parentId(raw.owner) ?? undefined,
  }
}

function sanitizeMoment(raw: Raw): Moment | null {
  const key = id(raw.id)
  const day = date(raw.date)
  const by = parentId(raw.by)
  if (!key || !day || !by) return null
  return {
    id: key,
    date: day,
    by,
    caption: text(raw.caption, 1000),
    photo: typeof raw.photo === 'string' && PHOTO.test(raw.photo) ? raw.photo : undefined,
    kidIds: ids(raw.kidIds),
    createdAt: timestamp(raw.createdAt),
    seenByOther: raw.seenByOther === true ? true : undefined,
  }
}

function sanitizeBagItem(raw: Raw): BagItem | null {
  const key = id(raw.id)
  const kidId = id(raw.kidId)
  if (!key || !kidId) return null
  return { id: key, kidId, label: text(raw.label, 200) ?? '', packed: raw.packed === true }
}
