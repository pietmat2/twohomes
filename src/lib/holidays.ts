/**
 * School holidays and public holidays, for Denmark and Poland.
 *
 * Children's breaks are where custody arrangements get argued over, so the
 * calendar should show them without anyone typing them in. Two kinds:
 *
 *  - Public holidays follow from the law and the date of Easter, so they are
 *    computed for any year.
 *  - School breaks are set by authorities, so they come from published
 *    tables, extended by a stated rule only where the source gives one.
 *    Years beyond what is published show public holidays only.
 *
 * Dates are plain YYYY-MM-DD strings handled in UTC, so no time zone can
 * move a holiday by a day.
 */

export type HolidayCountry = 'none' | 'dk' | 'pl'

export interface HolidaySettings {
  country: HolidayCountry
  /** Denmark: the winter-break week, '7' or '8'. Poland: a voivodeship slug. */
  region?: string
}

/** Most Danish municipalities take week 7; about twenty take week 8. */
export const DK_WINTER_WEEKS = ['7', '8'] as const

/** Stored as ASCII slugs; shown in Polish, since that is their proper name. */
export const PL_VOIVODESHIPS = {
  dolnoslaskie: 'dolnośląskie',
  'kujawsko-pomorskie': 'kujawsko-pomorskie',
  lubelskie: 'lubelskie',
  lubuskie: 'lubuskie',
  lodzkie: 'łódzkie',
  malopolskie: 'małopolskie',
  mazowieckie: 'mazowieckie',
  opolskie: 'opolskie',
  podkarpackie: 'podkarpackie',
  podlaskie: 'podlaskie',
  pomorskie: 'pomorskie',
  slaskie: 'śląskie',
  swietokrzyskie: 'świętokrzyskie',
  'warminsko-mazurskie': 'warmińsko-mazurskie',
  wielkopolskie: 'wielkopolskie',
  zachodniopomorskie: 'zachodniopomorskie',
} as const
export type Voivodeship = keyof typeof PL_VOIVODESHIPS

export type BreakKey =
  | 'autumn'
  | 'christmas'
  | 'winter'
  | 'easter'
  | 'ascension'
  | 'whitsun'
  | 'constitution'
  | 'summer'

export type DayKey =
  | 'newYear'
  | 'epiphany'
  | 'maundyThursday'
  | 'goodFriday'
  | 'easterSunday'
  | 'easterMonday'
  | 'labourDay'
  | 'may3'
  | 'ascensionDay'
  | 'whitSunday'
  | 'whitMonday'
  | 'corpusChristi'
  | 'assumption'
  | 'allSaints'
  | 'independence'
  | 'christmasEve'
  | 'christmasDay'
  | 'boxingDay'

export type Holiday =
  | { kind: 'school'; key: BreakKey; start: string; end: string }
  | { kind: 'public'; key: DayKey; start: string; end: string }

/** A sanitised copy, or null if the settings name no known country and region. */
export function validHolidays(value: unknown): HolidaySettings | null {
  const raw = value as Partial<HolidaySettings> | null
  if (!raw || typeof raw !== 'object') return null
  if (raw.country === 'none') return { country: 'none' }
  if (raw.country === 'dk' && DK_WINTER_WEEKS.includes(raw.region as '7' | '8')) {
    return { country: 'dk', region: raw.region }
  }
  if (raw.country === 'pl' && typeof raw.region === 'string' && raw.region in PL_VOIVODESHIPS) {
    return { country: 'pl', region: raw.region }
  }
  return null
}

// ---------------------------------------------------------------- dates ---

function iso(y: number, m: number, d: number): string {
  return new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10)
}

export function addDaysIso(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  return iso(y, m, d + days)
}

/** Easter Sunday, by the anonymous Gregorian algorithm. */
export function easter(year: number): string {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return iso(year, month, day)
}

function weekday(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay()
}

// -------------------------------------------------------- public holidays ---

function publicHolidays(country: 'dk' | 'pl', year: number): Holiday[] {
  const e = easter(year)
  const day = (key: DayKey, date: string): Holiday => ({ kind: 'public', key, start: date, end: date })
  if (country === 'dk') {
    // Store bededag was abolished from 2024.
    return [
      day('newYear', iso(year, 1, 1)),
      day('maundyThursday', addDaysIso(e, -3)),
      day('goodFriday', addDaysIso(e, -2)),
      day('easterSunday', e),
      day('easterMonday', addDaysIso(e, 1)),
      day('ascensionDay', addDaysIso(e, 39)),
      day('whitSunday', addDaysIso(e, 49)),
      day('whitMonday', addDaysIso(e, 50)),
      day('christmasDay', iso(year, 12, 25)),
      day('boxingDay', iso(year, 12, 26)),
    ]
  }
  return [
    day('newYear', iso(year, 1, 1)),
    day('epiphany', iso(year, 1, 6)),
    day('easterSunday', e),
    day('easterMonday', addDaysIso(e, 1)),
    day('labourDay', iso(year, 5, 1)),
    day('may3', iso(year, 5, 3)),
    day('whitSunday', addDaysIso(e, 49)),
    day('corpusChristi', addDaysIso(e, 60)),
    day('assumption', iso(year, 8, 15)),
    day('allSaints', iso(year, 11, 1)),
    day('independence', iso(year, 11, 11)),
    // A public holiday from 2025.
    ...(year >= 2025 ? [day('christmasEve', iso(year, 12, 24))] : []),
    day('christmasDay', iso(year, 12, 25)),
    day('boxingDay', iso(year, 12, 26)),
  ]
}

// ---------------------------------------------------------- Danish breaks ---

/**
 * Københavns Kommune's guide plan for 2026/27 and 2027/28, with winter break
 * in week 7. Each school sets its final plan with its board, so a school may
 * differ by a day or two.
 * https://www.kk.dk/borger/dagtilbud-og-skole/skole-og-fritid/vejledende-ferieplan-for-skoleaaret-i-koebenhavns-kommune
 */
const DK_BREAKS: [BreakKey, string, string][] = [
  ['summer', '2026-06-29', '2026-08-10'],
  ['autumn', '2026-10-12', '2026-10-16'],
  ['christmas', '2026-12-21', '2027-01-01'],
  ['winter', '2027-02-15', '2027-02-19'],
  ['easter', '2027-03-22', '2027-03-29'],
  ['ascension', '2027-05-06', '2027-05-07'],
  ['whitsun', '2027-05-16', '2027-05-17'],
  ['constitution', '2027-06-05', '2027-06-05'],
  ['summer', '2027-06-26', '2027-08-06'],
  ['autumn', '2027-10-18', '2027-10-22'],
  ['christmas', '2027-12-20', '2027-12-31'],
  ['winter', '2028-02-14', '2028-02-18'],
  ['easter', '2028-04-10', '2028-04-17'],
  ['ascension', '2028-05-25', '2028-05-26'],
  // Whit Monday and Constitution Day fall on the same day in 2028.
  ['whitsun', '2028-06-05', '2028-06-05'],
  ['constitution', '2028-06-05', '2028-06-05'],
  // Not in the table: the plan's own rule, from the last Saturday in June
  // until school starts six weeks later.
  ['summer', '2028-06-24', '2028-08-04'],
]

function danishBreaks(week: string): Holiday[] {
  // Week-8 municipalities take the same break one week later.
  const shift = week === '8' ? 7 : 0
  return DK_BREAKS.map(([key, start, end]) =>
    key === 'winter'
      ? { kind: 'school', key, start: addDaysIso(start, shift), end: addDaysIso(end, shift) }
      : { kind: 'school', key, start, end },
  )
}

// ---------------------------------------------------------- Polish breaks ---

/**
 * Ferie zimowe as announced by the Ministry of Education, by voivodeship.
 * https://www.gov.pl/web/edukacja/terminy-ferii-zimowych-w-roku-szkolnym-20262027
 * https://www.gov.pl/web/edukacja/terminy-ferii-zimowych-w-roku-szkolnym-20272028
 */
const PL_WINTER: { start: string; end: string; regions: Voivodeship[] }[] = [
  {
    start: '2027-01-18',
    end: '2027-01-31',
    regions: ['podkarpackie', 'podlaskie', 'dolnoslaskie', 'lodzkie', 'slaskie', 'opolskie'],
  },
  { start: '2027-02-01', end: '2027-02-14', regions: ['mazowieckie', 'pomorskie', 'swietokrzyskie', 'lubelskie'] },
  {
    start: '2027-02-15',
    end: '2027-02-28',
    regions: ['lubuskie', 'kujawsko-pomorskie', 'warminsko-mazurskie', 'wielkopolskie', 'zachodniopomorskie', 'malopolskie'],
  },
  {
    start: '2028-01-17',
    end: '2028-01-30',
    regions: ['podlaskie', 'kujawsko-pomorskie', 'swietokrzyskie', 'wielkopolskie', 'zachodniopomorskie', 'lubuskie', 'pomorskie'],
  },
  { start: '2028-01-31', end: '2028-02-13', regions: ['mazowieckie', 'warminsko-mazurskie', 'lodzkie', 'podkarpackie'] },
  {
    start: '2028-02-14',
    end: '2028-02-27',
    regions: ['opolskie', 'lubelskie', 'malopolskie', 'slaskie', 'dolnoslaskie'],
  },
]

/** The years the regulation's rules are applied to: the published window. */
const PL_RULE_YEARS = [2026, 2027, 2028]

/**
 * The rest follows the regulation on the school year, which the ministry's
 * 2026/27 calendar matches exactly (23–31 Dec 2026, 25–30 Mar 2027, holidays
 * from 26 Jun 2027):
 *  - Christmas break: 23–31 December;
 *  - spring break: the Thursday before Easter to the Tuesday after;
 *  - summer: from the day after the first Friday after 20 June, to 31 August.
 * https://www.gov.pl/web/edukacja/ministerstwo-edukacji-narodowej-oglosilo-kalendarz-roku-szkolnego-20262027
 */
function polishBreaks(region: Voivodeship): Holiday[] {
  const breaks: Holiday[] = []
  for (const year of PL_RULE_YEARS) {
    const e = easter(year)
    breaks.push({ kind: 'school', key: 'easter', start: addDaysIso(e, -3), end: addDaysIso(e, 2) })
    let lastDay = iso(year, 6, 21)
    while (weekday(lastDay) !== 5) lastDay = addDaysIso(lastDay, 1)
    breaks.push({ kind: 'school', key: 'summer', start: addDaysIso(lastDay, 1), end: iso(year, 8, 31) })
    breaks.push({ kind: 'school', key: 'christmas', start: iso(year, 12, 23), end: iso(year, 12, 31) })
  }
  for (const turn of PL_WINTER) {
    if (turn.regions.includes(region)) breaks.push({ kind: 'school', key: 'winter', start: turn.start, end: turn.end })
  }
  return breaks
}

// -------------------------------------------------------------- queries ---

function allFor(settings: HolidaySettings | undefined, years: number[]): Holiday[] {
  const valid = validHolidays(settings)
  if (!valid || valid.country === 'none') return []
  const school = valid.country === 'dk' ? danishBreaks(valid.region!) : polishBreaks(valid.region as Voivodeship)
  const days = years.flatMap((year) => publicHolidays(valid.country as 'dk' | 'pl', year))
  return [...school, ...days]
}

/** Everything overlapping [from, to], earliest first, school breaks before single days. */
export function holidaysBetween(settings: HolidaySettings | undefined, from: string, to: string): Holiday[] {
  const first = Number(from.slice(0, 4))
  const last = Number(to.slice(0, 4))
  const years = Array.from({ length: last - first + 1 }, (_, i) => first + i)
  return allFor(settings, years)
    .filter((h) => h.start <= to && h.end >= from)
    .sort((x, y) => x.start.localeCompare(y.start) || (x.kind === y.kind ? 0 : x.kind === 'school' ? -1 : 1))
}

export function holidaysOn(settings: HolidaySettings | undefined, date: string): Holiday[] {
  return holidaysBetween(settings, date, date)
}

/** School breaks under way on `from` or starting within `days` after it. */
export function upcomingBreaks(settings: HolidaySettings | undefined, from: string, days: number): Holiday[] {
  return holidaysBetween(settings, from, addDaysIso(from, days)).filter((h) => h.kind === 'school')
}
