import type { Lang } from './types'

/**
 * The language/locale mapping on its own, with no React and no message
 * catalogues, so storage and migration can use it without pulling in the rest.
 */
const LOCALES: Record<Lang, string> = {
  en: 'en-GB',
  da: 'da-DK',
  pl: 'pl-PL',
}

export const isLang = (value: unknown): value is Lang =>
  value === 'en' || value === 'da' || value === 'pl'

/** The Intl locale that goes with a language, used for dates, numbers and money. */
export const localeOf = (lang: Lang): string => LOCALES[lang]

/** Best guess from an older state that only stored an Intl locale. */
export function langFromLocale(locale: string | undefined): Lang {
  const prefix = (locale ?? '').slice(0, 2).toLowerCase()
  return isLang(prefix) ? prefix : 'en'
}

/** The closest supported language to what the browser asks for. */
export function detectLang(): Lang {
  if (typeof navigator === 'undefined') return 'en'
  for (const tag of navigator.languages ?? [navigator.language]) {
    const prefix = tag.slice(0, 2).toLowerCase()
    if (isLang(prefix)) return prefix
  }
  return 'en'
}
