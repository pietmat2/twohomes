import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { langFromLocale, localeOf } from './i18n-locale'
import { sanitizeState } from './sanitize'
import { isVaultRecord, type VaultRecord } from './vault'
import type { AppState, Lang } from './types'

/**
 * The only file that touches persistence.
 *
 * At most one of two records holds the family's data at any time:
 *  - `state`: plain JSON, when no passcode is set;
 *  - `vault`: the same state encrypted (see vault.ts), when one is.
 * Switching between them writes the new record before removing the old one,
 * so a crash in between leaves a duplicate, never nothing.
 *
 * Two small records sit beside it in the clear, because the lock screen has
 * to render before anything is decrypted: the language and theme, and the
 * count of wrong passcode attempts. Neither says anything about the family.
 */
const KEYS = {
  state: 'twohomes.state.v1',
  vault: 'twohomes.vault.v1',
  prefs: 'twohomes.prefs.v1',
  attempts: 'twohomes.lock.v1',
} as const

export const STATE_VERSION = 1

/**
 * Photos live inside the same record as everything else, so they have to stay
 * small. A real deployment would push the file to object storage and keep
 * only the URL here.
 */
export const PHOTO_MAX_EDGE = 900
export const PHOTO_QUALITY = 0.72

/**
 * Where the records live. On the web that is localStorage. In the native
 * shell it is Capacitor Preferences (UserDefaults on iOS, SharedPreferences on
 * Android), because iOS evicts webview localStorage under storage pressure,
 * and this may be the only copy of a family's schedule and ledger.
 */
interface Backend {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
}

const webBackend: Backend = {
  get: async (key) => localStorage.getItem(key),
  set: async (key, value) => localStorage.setItem(key, value),
  remove: async (key) => localStorage.removeItem(key),
}

const nativeBackend: Backend = {
  async get(key) {
    const { value } = await Preferences.get({ key })
    if (value !== null) return value
    // A build from before Preferences kept its data in webview localStorage.
    // Move it across the first time it is asked for, then forget the old copy.
    const legacy = localStorage.getItem(key)
    if (legacy === null) return null
    await Preferences.set({ key, value: legacy })
    localStorage.removeItem(key)
    return legacy
  },
  set: (key, value) => Preferences.set({ key, value }),
  async remove(key) {
    await Preferences.remove({ key })
    localStorage.removeItem(key)
  },
}

const backend = Capacitor.isNativePlatform() ? nativeBackend : webBackend

export type Stored =
  | { kind: 'none' }
  | { kind: 'plain'; state: AppState }
  | { kind: 'vault'; record: VaultRecord }

/** What is on this device, without decrypting anything. */
export async function readStored(): Promise<Stored> {
  try {
    const vault = await backend.get(KEYS.vault)
    if (vault) {
      const record: unknown = JSON.parse(vault)
      if (isVaultRecord(record)) return { kind: 'vault', record }
    }
    const raw = await backend.get(KEYS.state)
    if (!raw) return { kind: 'none' }
    const parsed = JSON.parse(raw) as AppState
    if (typeof parsed !== 'object' || parsed === null) return { kind: 'none' }
    return { kind: 'plain', state: migrate(parsed) }
  } catch {
    return { kind: 'none' }
  }
}

/** A reason code rather than a sentence, so the UI can translate it. */
export type SaveError = 'quota' | 'unknown'
export type SaveResult = { ok: true } | { ok: false; error: SaveError }

export function writePlain(state: AppState): Promise<SaveResult> {
  return write(KEYS.state, JSON.stringify(state))
}

export function writeVault(record: VaultRecord): Promise<SaveResult> {
  return write(KEYS.vault, JSON.stringify(record))
}

export const removePlain = () => backend.remove(KEYS.state)
export const removeVault = () => backend.remove(KEYS.vault)

async function write(key: string, value: string): Promise<SaveResult> {
  try {
    await backend.set(key, value)
    return { ok: true }
  } catch (error) {
    const isQuota = error instanceof DOMException && error.name.includes('Quota')
    return { ok: false, error: isQuota ? 'quota' : 'unknown' }
  }
}

/** Everything Twohomes has written on this device, gone. */
export async function eraseEverything(): Promise<void> {
  await Promise.all(Object.values(KEYS).map((key) => backend.remove(key)))
}

export interface Prefs {
  language: Lang
  theme: AppState['theme']
}

export async function readPrefs(): Promise<Prefs | null> {
  try {
    const raw = await backend.get(KEYS.prefs)
    return raw ? (JSON.parse(raw) as Prefs) : null
  } catch {
    return null
  }
}

export async function writePrefs(prefs: Prefs): Promise<void> {
  await write(KEYS.prefs, JSON.stringify(prefs))
}

/**
 * Wrong passcode attempts. After a few, each further try waits twice as long.
 * This slows down someone guessing at the lock screen; it does nothing against
 * someone with a copy of the files, which is what the key derivation is for.
 */
export interface Attempts {
  failures: number
  /** Epoch ms before which the next try is refused. */
  until: number
}

export const FREE_ATTEMPTS = 5
const BASE_DELAY_MS = 30_000
const MAX_DELAY_MS = 15 * 60_000

export async function readAttempts(): Promise<Attempts> {
  try {
    const raw = await backend.get(KEYS.attempts)
    const parsed = raw ? (JSON.parse(raw) as Attempts) : null
    return parsed && typeof parsed.failures === 'number' ? parsed : { failures: 0, until: 0 }
  } catch {
    return { failures: 0, until: 0 }
  }
}

export async function recordFailure(previous: Attempts): Promise<Attempts> {
  const failures = previous.failures + 1
  const over = failures - FREE_ATTEMPTS
  const delay = over < 0 ? 0 : Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** over)
  const next = { failures, until: Date.now() + delay }
  await write(KEYS.attempts, JSON.stringify(next))
  return next
}

export const clearAttempts = () => backend.remove(KEYS.attempts)

/** Fill in anything a state written by an older build is missing. */
function migrate(state: AppState): AppState {
  // Before languages existed, only an Intl locale was stored.
  const language = state.language ?? langFromLocale(state.locale)
  return {
    ...state,
    version: STATE_VERSION,
    language,
    locale: state.locale ?? localeOf(language),
    overrides: state.overrides ?? [],
    swaps: state.swaps ?? [],
    kids: state.kids ?? [],
    expenses: state.expenses ?? [],
    settlements: state.settlements ?? [],
    events: state.events ?? [],
    bag: state.bag ?? [],
    moments: state.moments ?? [],
    theme: state.theme ?? 'system',
  }
}

export { migrate as migrateState }

/** Plain JSON. Only offered when no passcode is set; see Settings. */
export function exportState(state: AppState): string {
  return JSON.stringify(state, null, 2)
}

export type Imported =
  | { kind: 'plain'; state: AppState }
  | { kind: 'vault'; record: VaultRecord }
  | { kind: 'invalid' }

/** Recognise an export. An encrypted one still needs its passcode to open. */
export function parseImport(json: string): Imported {
  try {
    const parsed: unknown = JSON.parse(json)
    if (isVaultRecord(parsed)) return { kind: 'vault', record: parsed }
    const state = sanitizeState(parsed)
    return state ? { kind: 'plain', state } : { kind: 'invalid' }
  } catch {
    return { kind: 'invalid' }
  }
}

/**
 * Downscale a picked image to a data URL small enough to keep on the device.
 *
 * Redrawing through a canvas also strips everything but the pixels: EXIF, GPS
 * coordinates, camera serial numbers. A photo taken at home doesn't carry the
 * address of that home to the other parent.
 */
export function fileToPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('That file is not an image we can read.'))
      image.onload = () => {
        const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(image.width * scale)
        canvas.height = Math.round(image.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not process that image.'))
          return
        }
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', PHOTO_QUALITY))
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

/** Rough size of what we are holding, shown in Settings. */
export function storageFootprintKb(state: AppState): number {
  try {
    return Math.round(JSON.stringify(state).length / 1024)
  } catch {
    return 0
  }
}
