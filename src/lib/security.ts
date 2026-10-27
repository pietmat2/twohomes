import { createContext, useContext } from 'react'
import type { AppState } from './types'
import type { VaultRecord } from './vault'

export interface SecurityValue {
  /** Whether a passcode is set, and so whether the data is encrypted. */
  hasPasscode: boolean
  lockNow: () => Promise<void>
  /** These three throw WrongPasscodeError when `current` is wrong. */
  setPasscode: (passcode: string) => Promise<void>
  changePasscode: (current: string, next: string) => Promise<void>
  removePasscode: (current: string) => Promise<void>
  /** An encrypted copy when a passcode is set, plain JSON when not. */
  exportFile: () => Promise<string>
  /** Decrypts and validates an encrypted export. */
  openImport: (record: VaultRecord, passcode: string) => Promise<AppState>
  /** Removes everything Twohomes has written on this device. */
  erase: () => Promise<void>
}

export const SecurityContext = createContext<SecurityValue | null>(null)

export function useSecurity(): SecurityValue {
  const value = useContext(SecurityContext)
  if (!value) throw new Error('useSecurity must be used inside SecurityProvider')
  return value
}

/** Locks after this long out of the app: long enough to fetch a photo from the camera roll. */
export const AWAY_MS = 60_000
/** And after this long open but untouched, in case the phone is put down unlocked. */
export const IDLE_MS = 5 * 60_000
