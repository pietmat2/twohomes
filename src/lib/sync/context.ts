import { createContext, useContext } from 'react'

/** `off`: not sharing · `unavailable`: no relay in this build. */
export type SyncStatus = 'off' | 'unavailable' | 'syncing' | 'ok' | 'offline' | 'error'

export interface SyncValue {
  status: SyncStatus
  /** When the last full exchange with the relay finished, this session. */
  lastSyncAt: Date | null
  /** Starts a family and returns the invitation link. */
  invite: () => Promise<string>
  /** The link for a family this device already started, while it waits. */
  inviteLink: () => string | null
  /** Throws SyncJoinError on a bad link or a full family. */
  join: (code: string) => Promise<void>
  stop: () => Promise<void>
}

export class SyncJoinError extends Error {
  reason: 'bad_link' | 'full' | 'network'
  constructor(reason: 'bad_link' | 'full' | 'network') {
    super(reason)
    this.name = 'SyncJoinError'
    this.reason = reason
  }
}

export const SyncContext = createContext<SyncValue | null>(null)

export function useSync(): SyncValue {
  const value = useContext(SyncContext)
  if (!value) throw new Error('useSync must be used inside SyncProvider')
  return value
}

/** How long the app waits between checks while it is open and visible. */
export const POLL_MS = 10_000
