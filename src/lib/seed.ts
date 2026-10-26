import { addDays, startOfWeek, subDays } from 'date-fns'
import { otherParent, patternParent, toISO } from './schedule'
import { STATE_VERSION } from './storage'
import type { AppState } from './types'

export function newId(prefix = 'id'): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}_${random}`
}

/** A believable week of history so the app has something to show on first open. */
export function demoState(): AppState {
  const today = new Date()
  const now = new Date().toISOString()
  const monday = startOfWeek(subDays(today, 7), { weekStartsOn: 1 })
  const kidA = newId('kid')
  const kidB = newId('kid')

  const schedule = {
    patternId: '2-2-3' as const,
    anchorDate: toISO(monday),
    startParent: 'a' as const,
    handoverTime: '16:00',
    handoverPlace: 'School gate',
  }

  // The sample swap only makes sense if the days really are Anna's to give up,
  // and the sample override only if it changes something.
  const swapDates: string[] = []
  let overrideDate = toISO(addDays(today, 9))
  for (let i = 2; i < 40 && swapDates.length < 2; i++) {
    const iso = toISO(addDays(today, i))
    if (patternParent(schedule, iso) === 'a') swapDates.push(iso)
  }
  for (let i = 9; i < 40; i++) {
    const iso = toISO(addDays(today, i))
    if (!swapDates.includes(iso) && patternParent(schedule, iso) === 'a') {
      overrideDate = iso
      break
    }
  }

  return {
    version: STATE_VERSION,
    me: 'a',
    parents: {
      a: { id: 'a', name: 'Anna', homeName: 'Nørrebro' },
      b: { id: 'b', name: 'Jonas', homeName: 'Valby' },
    },
    currency: 'DKK',
    locale: 'da-DK',
    theme: 'system',
    schedule,
    overrides: [
      {
        id: newId('ovr'),
        date: overrideDate,
        parent: otherParent(patternParent(schedule, overrideDate)),
        reason: 'Cousin birthday party',
        createdAt: now,
      },
    ],
    swaps: [
      {
        id: newId('swp'),
        dates: swapDates,
        from: 'a',
        to: 'b',
        message: 'Work trip those two days. Could you take them?',
        status: 'pending',
        createdAt: now,
      },
    ],
    kids: [
      {
        id: kidA,
        name: 'Mila',
        birthdate: toISO(subDays(today, 365 * 8 + 40)),
        emoji: 'M',
        school: 'Nørrebro Skole, class 2B',
        doctor: 'Dr. Holm, Blegdamsvej clinic',
        allergies: 'Peanuts. EpiPen travels in the blue bag.',
        notes: 'Sleeps better with the night light on.',
      },
      {
        id: kidB,
        name: 'Oscar',
        birthdate: toISO(subDays(today, 365 * 4 + 120)),
        emoji: 'O',
        school: 'Solsikken kindergarten',
        notes: 'Swimming on Thursdays. Needs goggles.',
      },
    ],
    expenses: [
      {
        id: newId('exp'),
        date: toISO(subDays(today, 12)),
        title: 'Winter boots',
        amountCents: 69900,
        category: 'clothing',
        paidBy: 'a',
        payerSharePct: 50,
        kidIds: [kidA],
        note: 'Size 32, worn at both homes.',
        createdAt: now,
      },
      {
        id: newId('exp'),
        date: toISO(subDays(today, 9)),
        title: 'Swimming term fee',
        amountCents: 120000,
        category: 'activities',
        paidBy: 'b',
        payerSharePct: 50,
        kidIds: [kidB],
        createdAt: now,
      },
      {
        id: newId('exp'),
        date: toISO(subDays(today, 5)),
        title: 'Dentist, check-up',
        amountCents: 45000,
        category: 'health',
        paidBy: 'a',
        payerSharePct: 50,
        kidIds: [kidA, kidB],
        createdAt: now,
      },
      {
        id: newId('exp'),
        date: toISO(subDays(today, 2)),
        title: 'School trip contribution',
        amountCents: 25000,
        category: 'school',
        paidBy: 'a',
        payerSharePct: 50,
        kidIds: [kidA],
        createdAt: now,
      },
    ],
    settlements: [
      {
        id: newId('set'),
        date: toISO(subDays(today, 7)),
        from: 'b',
        to: 'a',
        amountCents: 35000,
        note: 'MobilePay, part of the boots',
        createdAt: now,
      },
    ],
    events: [
      {
        id: newId('evt'),
        date: toISO(addDays(today, 1)),
        time: '17:30',
        title: 'Swimming lesson',
        type: 'activity',
        kidIds: [kidB],
        location: 'Øbro Hallen',
      },
      {
        id: newId('evt'),
        date: toISO(addDays(today, 10)),
        time: '08:15',
        title: 'Parent meeting, class 2B',
        type: 'school',
        kidIds: [kidA],
        location: 'School hall',
        note: 'Both of us said we would come.',
      },
      {
        id: newId('evt'),
        date: toISO(addDays(today, 14)),
        time: '09:00',
        title: 'Dentist follow-up',
        type: 'medical',
        kidIds: [kidA],
        owner: 'b',
      },
    ],
    bag: [
      { id: newId('bag'), kidId: kidA, label: 'EpiPen', packed: true },
      { id: newId('bag'), kidId: kidA, label: 'Reading folder', packed: false },
      { id: newId('bag'), kidId: kidB, label: 'Swimming goggles', packed: false },
      { id: newId('bag'), kidId: kidB, label: 'Blue rabbit', packed: true },
    ],
    moments: [
      {
        id: newId('mom'),
        date: toISO(subDays(today, 3)),
        by: 'a',
        caption: 'First time she rode to school without stabilisers.',
        kidIds: [kidA],
        createdAt: now,
      },
      {
        id: newId('mom'),
        date: toISO(subDays(today, 1)),
        by: 'b',
        caption: 'Oscar fell asleep halfway through dinner. Long day at the pool.',
        kidIds: [kidB],
        createdAt: now,
        seenByOther: true,
      },
    ],
  }
}

/** An empty-but-usable state for someone who skips the demo data. */
export function blankState(): AppState {
  const today = new Date()
  const demo = demoState()
  return {
    ...demo,
    parents: {
      a: { id: 'a', name: 'Parent one', homeName: 'First home' },
      b: { id: 'b', name: 'Parent two', homeName: 'Second home' },
    },
    schedule: {
      patternId: 'alternating-weeks',
      anchorDate: toISO(startOfWeek(today, { weekStartsOn: 1 })),
      startParent: 'a',
      handoverTime: '16:00',
    },
    overrides: [],
    swaps: [],
    kids: [],
    expenses: [],
    settlements: [],
    events: [],
    bag: [],
    moments: [],
  }
}
