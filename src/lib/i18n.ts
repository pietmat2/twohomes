import { createElement, Fragment, useMemo, type ReactNode } from 'react'
import {
  differenceInCalendarDays,
  format,
  isThisYear,
  isToday,
  isTomorrow,
  isYesterday,
  parseISO,
  type Locale,
} from 'date-fns'
import { da as daDates, enGB, pl as plDates } from 'date-fns/locale'
import { isLang, langFromLocale, localeOf } from './i18n-locale'
import { en, type Catalogue, type Message, type MessageKey, type Plural } from './messages/en'
import { da } from './messages/da'
import { pl } from './messages/pl'
import { useApp } from './store'
import type { Lang } from './types'

/** Languages are listed in their own language, the way a reader finds them. */
export const LANGUAGES: { value: Lang; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'da', label: 'Dansk' },
  { value: 'pl', label: 'Polski' },
]

const CATALOGUES: Record<Lang, Catalogue> = { en, da, pl }
const DATE_LOCALES: Record<Lang, Locale> = { en: enGB, da: daDates, pl: plDates }

export { isLang, langFromLocale, localeOf }
export type { Lang }

export type Vars = Record<string, string | number>

/** The chosen plural form, before any placeholders are filled in. */
function templateFor(lang: Lang, key: MessageKey, count?: unknown): string {
  const message: Message = CATALOGUES[lang][key] ?? en[key]
  if (typeof message === 'string') return message
  // Polish needs one/few/many; English and Danish only one/other.
  const rule = new Intl.PluralRules(localeOf(lang)).select(Number(count ?? 0))
  return message[rule as keyof Plural] ?? message.other
}

export function translate(lang: Lang, key: MessageKey, vars?: Vars): string {
  // An unknown placeholder is left visible rather than silently blanked.
  return templateFor(lang, key, vars?.count).replace(/\{(\w+)\}/g, (whole, name: string) =>
    vars && name in vars ? String(vars[name]) : whole,
  )
}

/**
 * Same substitution, but a placeholder may be a React node — so a name can keep
 * its home colour wherever the sentence happens to put it.
 */
export function translateNode(
  lang: Lang,
  key: MessageKey,
  vars: Record<string, ReactNode>,
): ReactNode {
  const parts = templateFor(lang, key, vars.count).split(/(\{\w+\})/g)
  return createElement(
    Fragment,
    null,
    ...parts.map((part) => {
      const match = /^\{(\w+)\}$/.exec(part)
      return match && match[1] in vars ? vars[match[1]] : part
    }),
  )
}

export function useI18n() {
  const { state } = useApp()
  const lang = state.language

  return useMemo(() => {
    const locale = localeOf(lang)
    const dates = DATE_LOCALES[lang]
    const t = (key: MessageKey, vars?: Vars) => translate(lang, key, vars)
    const tNode = (key: MessageKey, vars: Record<string, ReactNode>) =>
      translateNode(lang, key, vars)

    return {
      lang,
      locale,
      dates,
      t,
      tNode,

      /** "Today", "Tomorrow", otherwise a short date. */
      friendlyDay(iso: string): string {
        const date = parseISO(iso)
        if (isToday(date)) return t('date.today')
        if (isTomorrow(date)) return t('date.tomorrow')
        if (isYesterday(date)) return t('date.yesterday')
        return format(date, isThisYear(date) ? 'EEE d MMM' : 'd MMM yyyy', { locale: dates })
      },

      /** A day as it reads mid-sentence: "until tomorrow", "until Wednesday". */
      daySpoken(iso: string): string {
        const date = parseISO(iso)
        if (isToday(date)) return t('date.todaySpoken')
        if (isTomorrow(date)) return t('date.tomorrowSpoken')
        if (isYesterday(date)) return t('date.yesterdaySpoken')
        const days = differenceInCalendarDays(date, new Date())
        if (days > 0 && days < 7) return format(date, 'EEEE', { locale: dates })
        if (days < 0 && days > -7)
          return t('date.lastWeekday', { weekday: format(date, 'EEEE', { locale: dates }) })
        return format(date, isThisYear(date) ? 'EEEE d MMMM' : 'd MMMM yyyy', { locale: dates })
      },

      longDay(iso: string): string {
        const date = parseISO(iso)
        return format(date, isThisYear(date) ? 'EEEE d MMMM' : 'EEEE d MMMM yyyy', {
          locale: dates,
        })
      },

      /**
       * LLLL is the standalone month ("październik"), where MMMM would give the
       * genitive form Polish uses inside a date ("26 października").
       */
      monthTitle(date: Date): string {
        return format(date, 'LLLL yyyy', { locale: dates })
      },

      weekdayNarrow(date: Date): string {
        return date.toLocaleDateString(locale, { weekday: 'narrow' })
      },

      weekdayShort(date: Date): string {
        return date.toLocaleDateString(locale, { weekday: 'short' })
      },

      /** "Mila and Oscar", "Mila i Oscar", "Mila og Oscar". */
      joinList(items: string[]): string {
        if (items.length === 0) return ''
        try {
          return new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(items)
        } catch {
          return items.join(`, `)
        }
      },
    }
  }, [lang])
}
