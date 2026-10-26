import type { AppState } from './types'

const KEY = 'twohomes.state.v1'

export const STATE_VERSION = 1

/**
 * Photos live inside the same localStorage blob as everything else, so they
 * have to stay small. A real deployment would push the file to object storage
 * and keep only the URL here.
 */
export const PHOTO_MAX_EDGE = 900
export const PHOTO_QUALITY = 0.72

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AppState
    if (typeof parsed !== 'object' || parsed === null) return null
    return migrate(parsed)
  } catch {
    return null
  }
}

export function saveState(state: AppState): { ok: true } | { ok: false; error: string } {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
    return { ok: true }
  } catch (error) {
    const isQuota = error instanceof DOMException && error.name.includes('Quota')
    return {
      ok: false,
      error: isQuota
        ? 'This device is out of local storage. Remove a few photos and try again.'
        : 'Could not save to this device.',
    }
  }
}

export function clearState() {
  localStorage.removeItem(KEY)
}

/** Fill in anything a state written by an older build is missing. */
function migrate(state: AppState): AppState {
  return {
    ...state,
    version: STATE_VERSION,
    overrides: state.overrides ?? [],
    swaps: state.swaps ?? [],
    kids: state.kids ?? [],
    expenses: state.expenses ?? [],
    settlements: state.settlements ?? [],
    events: state.events ?? [],
    bag: state.bag ?? [],
    moments: state.moments ?? [],
    theme: state.theme ?? 'system',
    locale: state.locale ?? 'en-GB',
  }
}

export function exportState(state: AppState): string {
  return JSON.stringify(state, null, 2)
}

export function importState(json: string): AppState | null {
  try {
    const parsed = JSON.parse(json) as AppState
    if (!parsed || typeof parsed !== 'object' || !parsed.parents || !parsed.schedule) return null
    return migrate(parsed)
  } catch {
    return null
  }
}

/** Downscale a picked image to a data URL small enough to keep on the device. */
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
