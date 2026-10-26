import { addDays, startOfWeek, subDays } from 'date-fns'
import { detectLang, localeOf } from './i18n-locale'
import { otherParent, patternParent, toISO } from './schedule'
import { STATE_VERSION } from './storage'
import type { AppState, Lang } from './types'

export function newId(prefix = 'id'): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}_${random}`
}

interface DemoContent {
  currency: string
  parentA: string
  parentB: string
  homeA: string
  homeB: string
  blankA: string
  blankB: string
  handoverPlace: string
  swapMessage: string
  overrideReason: string
  kidA: string
  kidB: string
  schoolA: string
  doctorA: string
  allergiesA: string
  notesA: string
  schoolB: string
  notesB: string
  expenses: [string, string, string, string]
  expenseNote: string
  settlementNote: string
  events: [string, string, string]
  eventPlaceA: string
  eventPlaceB: string
  eventNote: string
  bag: [string, string, string, string]
  moments: [string, string]
}

/**
 * The sample data is the first thing anyone sees, so it is written in their
 * language rather than translated-looking English.
 */
const DEMO: Record<Lang, DemoContent> = {
  en: {
    currency: 'GBP',
    parentA: 'Anna',
    parentB: 'Jonas',
    homeA: 'North side',
    homeB: 'South side',
    blankA: 'Parent one',
    blankB: 'Parent two',
    handoverPlace: 'School gate',
    swapMessage: 'Work trip those two days. Could you take them?',
    overrideReason: 'Cousin’s birthday party',
    kidA: 'Mila',
    kidB: 'Oscar',
    schoolA: 'Fairfield Primary, class 2B',
    doctorA: 'Dr Holm, Bridge Street clinic',
    allergiesA: 'Peanuts. EpiPen travels in the blue bag.',
    notesA: 'Sleeps better with the night light on.',
    schoolB: 'Sunflower nursery',
    notesB: 'Swimming on Thursdays. Needs goggles.',
    expenses: ['Winter boots', 'Swimming term fee', 'Dentist, check-up', 'School trip'],
    expenseNote: 'Size 32, worn at both homes.',
    settlementNote: 'Bank transfer, part of the boots',
    events: ['Swimming lesson', 'Parent meeting, class 2B', 'Dentist follow-up'],
    eventPlaceA: 'Riverside pool',
    eventPlaceB: 'School hall',
    eventNote: 'We both said we would come.',
    bag: ['EpiPen', 'Reading folder', 'Swimming goggles', 'Blue rabbit'],
    moments: [
      'First time she rode to school without stabilisers.',
      'Oscar fell asleep halfway through dinner. Long day at the pool.',
    ],
  },
  da: {
    currency: 'DKK',
    parentA: 'Anna',
    parentB: 'Jonas',
    homeA: 'Nørrebro',
    homeB: 'Valby',
    blankA: 'Forælder et',
    blankB: 'Forælder to',
    handoverPlace: 'Skolens port',
    swapMessage: 'Jeg er på arbejdsrejse de to dage. Kan du tage dem?',
    overrideReason: 'Fætterens fødselsdag',
    kidA: 'Mila',
    kidB: 'Oscar',
    schoolA: 'Nørrebro Skole, 2.B',
    doctorA: 'Læge Holm, Blegdamsvej',
    allergiesA: 'Jordnødder. EpiPen ligger i den blå taske.',
    notesA: 'Sover bedre med natlampen tændt.',
    schoolB: 'Solsikken, børnehave',
    notesB: 'Svømning om torsdagen. Skal have svømmebriller med.',
    expenses: ['Vinterstøvler', 'Svømning, sæsongebyr', 'Tandlæge, kontrol', 'Skoletur'],
    expenseNote: 'Størrelse 32, bruges i begge hjem.',
    settlementNote: 'MobilePay, en del af støvlerne',
    events: ['Svømning', 'Forældremøde, 2.B', 'Tandlæge, opfølgning'],
    eventPlaceA: 'Øbrohallen',
    eventPlaceB: 'Skolens aula',
    eventNote: 'Vi sagde begge, at vi kommer.',
    bag: ['EpiPen', 'Læsemappe', 'Svømmebriller', 'Den blå kanin'],
    moments: [
      'Første gang hun cyklede i skole uden støttehjul.',
      'Oscar faldt i søvn midt i aftensmaden. Lang dag i svømmehallen.',
    ],
  },
  pl: {
    currency: 'PLN',
    parentA: 'Ania',
    parentB: 'Marek',
    homeA: 'Mokotów',
    homeB: 'Praga',
    blankA: 'Rodzic pierwszy',
    blankB: 'Rodzic drugi',
    handoverPlace: 'Brama szkoły',
    swapMessage: 'Mam wtedy wyjazd służbowy. Weźmiesz dzieci?',
    overrideReason: 'Urodziny kuzyna',
    kidA: 'Zosia',
    kidB: 'Antek',
    schoolA: 'Szkoła Podstawowa nr 12, klasa 2B',
    doctorA: 'Dr Nowak, przychodnia na Mokotowskiej',
    allergiesA: 'Orzeszki ziemne. EpiPen jeździ w niebieskiej torbie.',
    notesA: 'Lepiej śpi przy włączonej lampce.',
    schoolB: 'Przedszkole Słoneczko',
    notesB: 'Basen w czwartki. Potrzebne okularki.',
    expenses: [
      'Zimowe buty',
      'Basen, opłata za semestr',
      'Dentysta, przegląd',
      'Wycieczka szkolna',
    ],
    expenseNote: 'Rozmiar 32, noszone w obu domach.',
    settlementNote: 'BLIK, część za buty',
    events: ['Basen', 'Zebranie rodziców, klasa 2B', 'Dentysta, wizyta kontrolna'],
    eventPlaceA: 'Pływalnia Wodnik',
    eventPlaceB: 'Aula szkolna',
    eventNote: 'Oboje mówiliśmy, że przyjdziemy.',
    bag: ['EpiPen', 'Teczka do czytania', 'Okularki na basen', 'Niebieski królik'],
    moments: [
      'Pierwszy raz pojechała do szkoły bez kółek bocznych.',
      'Antek zasnął w połowie kolacji. Długi dzień na basenie.',
    ],
  },
}

/** A believable week of history so the app has something to show on first open. */
export function demoState(lang: Lang = detectLang()): AppState {
  const content = DEMO[lang]
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
    handoverPlace: content.handoverPlace,
  }

  // The sample swap only makes sense if the days really are A's to give up,
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
      a: { id: 'a', name: content.parentA, homeName: content.homeA },
      b: { id: 'b', name: content.parentB, homeName: content.homeB },
    },
    language: lang,
    currency: content.currency,
    locale: localeOf(lang),
    theme: 'system',
    schedule,
    overrides: [
      {
        id: newId('ovr'),
        date: overrideDate,
        parent: otherParent(patternParent(schedule, overrideDate)),
        reason: content.overrideReason,
        createdAt: now,
      },
    ],
    swaps: [
      {
        id: newId('swp'),
        dates: swapDates,
        from: 'a',
        to: 'b',
        message: content.swapMessage,
        status: 'pending',
        createdAt: now,
      },
    ],
    kids: [
      {
        id: kidA,
        name: content.kidA,
        birthdate: toISO(subDays(today, 365 * 8 + 40)),
        emoji: content.kidA.slice(0, 1),
        school: content.schoolA,
        doctor: content.doctorA,
        allergies: content.allergiesA,
        notes: content.notesA,
      },
      {
        id: kidB,
        name: content.kidB,
        birthdate: toISO(subDays(today, 365 * 4 + 120)),
        emoji: content.kidB.slice(0, 1),
        school: content.schoolB,
        notes: content.notesB,
      },
    ],
    expenses: [
      {
        id: newId('exp'),
        date: toISO(subDays(today, 12)),
        title: content.expenses[0],
        amountCents: 69900,
        category: 'clothing',
        paidBy: 'a',
        payerSharePct: 50,
        kidIds: [kidA],
        note: content.expenseNote,
        createdAt: now,
      },
      {
        id: newId('exp'),
        date: toISO(subDays(today, 9)),
        title: content.expenses[1],
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
        title: content.expenses[2],
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
        title: content.expenses[3],
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
        note: content.settlementNote,
        createdAt: now,
      },
    ],
    events: [
      {
        id: newId('evt'),
        date: toISO(addDays(today, 1)),
        time: '17:30',
        title: content.events[0],
        type: 'activity',
        kidIds: [kidB],
        location: content.eventPlaceA,
      },
      {
        id: newId('evt'),
        date: toISO(addDays(today, 10)),
        time: '08:15',
        title: content.events[1],
        type: 'school',
        kidIds: [kidA],
        location: content.eventPlaceB,
        note: content.eventNote,
      },
      {
        id: newId('evt'),
        date: toISO(addDays(today, 14)),
        time: '09:00',
        title: content.events[2],
        type: 'medical',
        kidIds: [kidA],
        owner: 'b',
      },
    ],
    bag: [
      { id: newId('bag'), kidId: kidA, label: content.bag[0], packed: true },
      { id: newId('bag'), kidId: kidA, label: content.bag[1], packed: false },
      { id: newId('bag'), kidId: kidB, label: content.bag[2], packed: false },
      { id: newId('bag'), kidId: kidB, label: content.bag[3], packed: true },
    ],
    moments: [
      {
        id: newId('mom'),
        date: toISO(subDays(today, 3)),
        by: 'a',
        caption: content.moments[0],
        kidIds: [kidA],
        createdAt: now,
      },
      {
        id: newId('mom'),
        date: toISO(subDays(today, 1)),
        by: 'b',
        caption: content.moments[1],
        kidIds: [kidB],
        createdAt: now,
        seenByOther: true,
      },
    ],
  }
}

/** An empty-but-usable state for someone who skips the demo data. */
export function blankState(lang: Lang = detectLang()): AppState {
  const content = DEMO[lang]
  const today = new Date()
  const demo = demoState(lang)
  return {
    ...demo,
    parents: {
      a: { id: 'a', name: content.blankA, homeName: content.homeA },
      b: { id: 'b', name: content.blankB, homeName: content.homeB },
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
