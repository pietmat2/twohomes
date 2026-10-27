import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { LockScreen } from '../components/LockScreen'
import { detectLang } from './i18n-locale'
import { sanitizeState } from './sanitize'
import { AWAY_MS, IDLE_MS, SecurityContext, type SecurityValue } from './security'
import { blankState, demoState } from './seed'
import {
  clearAttempts,
  eraseEverything,
  exportState,
  migrateState,
  readPrefs,
  readStored,
  removePlain,
  removeVault,
  writePlain,
  writePrefs,
  writeVault,
  type Prefs,
  type SaveError,
  type SaveResult,
} from './storage'
import { StoreProvider } from './StoreProvider'
import { relayToken } from './sync/crypto'
import { leaveFamily } from './sync/relay'
import type { AppState } from './types'
import {
  createVault,
  headerOf,
  openVault,
  rewrapVault,
  seal,
  unseal,
  type VaultHeader,
  type VaultRecord,
} from './vault'

type Phase =
  | { kind: 'loading' }
  | { kind: 'locked'; record: VaultRecord; prefs: Prefs }
  /** `generation` remounts the store, so an unlock or an erase starts it fresh. */
  | { kind: 'open'; state: AppState; generation: number }

/**
 * Sits above the store and decides what it gets to see. With no passcode it
 * loads the plain record and gets out of the way. With one, it shows the lock
 * screen, holds the data key in memory once unlocked, and encrypts every save.
 *
 * Locking drops the key and unmounts the whole app, so nothing decrypted is
 * left in the React tree behind the lock screen.
 */
export function SecurityProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' })
  const [hasPasscode, setHasPasscode] = useState(false)
  const [saveError, setSaveError] = useState<SaveError | null>(null)

  const vault = useRef<{ header: VaultHeader; dataKey: CryptoKey } | null>(null)
  /** The latest state the app has handed over, saved or about to be. */
  const current = useRef<AppState | null>(null)
  const pending = useRef<AppState | null>(null)
  const draining = useRef<Promise<void> | null>(null)
  const generation = useRef(0)
  const lastPrefs = useRef('')

  const open = useCallback((state: AppState) => {
    current.current = state
    generation.current += 1
    setPhase({ kind: 'open', state, generation: generation.current })
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const stored = await readStored()
      if (cancelled) return
      if (stored.kind === 'vault') {
        const prefs = (await readPrefs()) ?? { language: detectLang(), theme: 'system' }
        setHasPasscode(true)
        setPhase({ kind: 'locked', record: stored.record, prefs })
        return
      }
      open(stored.kind === 'plain' ? stored.state : demoState())
    })()
    return () => {
      cancelled = true
    }
  }, [open])

  /** One save, in whichever form the current mode calls for. */
  const write = useCallback(async (state: AppState): Promise<SaveResult> => {
    try {
      const key = vault.current
      const result = key
        ? await writeVault(await seal(key.header, key.dataKey, state))
        : await writePlain(state)
      const prefs = JSON.stringify({ language: state.language, theme: state.theme })
      if (prefs !== lastPrefs.current) {
        lastPrefs.current = prefs
        await writePrefs({ language: state.language, theme: state.theme })
      }
      return result
    } catch {
      return { ok: false, error: 'unknown' }
    }
  }, [])

  /**
   * Saves are coalesced: while one is being encrypted and written, further
   * changes only replace the next one. Typing a name doesn't queue a write per
   * keystroke, and writes never land out of order.
   */
  const persist = useCallback(
    (state: AppState) => {
      current.current = state
      pending.current = state
      if (draining.current) return
      const drain = async () => {
        while (pending.current) {
          const next = pending.current
          pending.current = null
          const result = await write(next)
          setSaveError(result.ok ? null : result.error)
        }
        draining.current = null
      }
      draining.current = drain()
    },
    [write],
  )

  const flush = useCallback(async () => {
    while (draining.current) await draining.current
  }, [])

  const lockNow = useCallback(async () => {
    if (!vault.current) return
    await flush()
    const stored = await readStored()
    if (stored.kind !== 'vault') return
    const prefs = (await readPrefs()) ?? { language: detectLang(), theme: 'system' }
    vault.current = null
    current.current = null
    setPhase({ kind: 'locked', record: stored.record, prefs })
  }, [flush])

  const unlock = useCallback(
    async (record: VaultRecord, passcode: string) => {
      const dataKey = await openVault(record, passcode)
      const state = migrateState((await unseal(record, dataKey)) as AppState)
      vault.current = { header: headerOf(record), dataKey }
      await clearAttempts()
      open(state)
    },
    [open],
  )

  const erase = useCallback(async () => {
    await flush()
    // Free this device's place in the family, so the other home can invite again.
    const sync = current.current?.sync
    if (sync) {
      try {
        await leaveFamily(sync.familyId, await relayToken(sync.secret), sync.device)
      } catch {
        // Offline: nothing to free, or nothing we can do about it now.
      }
    }
    const language = current.current?.language ?? (phase.kind === 'locked' ? phase.prefs.language : detectLang())
    await eraseEverything()
    vault.current = null
    lastPrefs.current = ''
    setHasPasscode(false)
    open(blankState(language))
  }, [flush, open, phase])

  const security = useMemo<SecurityValue>(
    () => ({
      hasPasscode,
      lockNow,

      async setPasscode(passcode) {
        await flush()
        const state = current.current
        if (!state) return
        const { header, dataKey } = await createVault(passcode)
        const result = await writeVault(await seal(header, dataKey, state))
        if (!result.ok) throw new Error(result.error)
        // Only once the encrypted copy is safely written does the plain one go.
        vault.current = { header, dataKey }
        await removePlain()
        // The lock screen reads these before anything is decrypted.
        lastPrefs.current = JSON.stringify({ language: state.language, theme: state.theme })
        await writePrefs({ language: state.language, theme: state.theme })
        setHasPasscode(true)
      },

      async changePasscode(currentPasscode, next) {
        const key = vault.current
        const state = current.current
        if (!key || !state) return
        await flush()
        const header = await rewrapVault(key.header, currentPasscode, next)
        const result = await writeVault(await seal(header, key.dataKey, state))
        if (!result.ok) throw new Error(result.error)
        vault.current = { header, dataKey: key.dataKey }
      },

      async removePasscode(currentPasscode) {
        const key = vault.current
        const state = current.current
        if (!key || !state) return
        await openVault(key.header, currentPasscode)
        await flush()
        const result = await writePlain(state)
        if (!result.ok) throw new Error(result.error)
        vault.current = null
        await removeVault()
        setHasPasscode(false)
      },

      async exportFile() {
        await flush()
        const state = current.current
        if (!state) throw new Error('nothing to export')
        const key = vault.current
        // The family's secret and this device's signing key never leave in a file.
        const { sync: _sync, ...shareable } = state
        // The export is the vault itself: same format, same passcode.
        return key
          ? JSON.stringify(await seal(key.header, key.dataKey, shareable))
          : exportState(shareable)
      },

      async openImport(record, passcode) {
        const dataKey = await openVault(record, passcode)
        const state = sanitizeState(await unseal(record, dataKey))
        if (!state) throw new Error('invalid')
        return state
      },

      erase,
    }),
    [hasPasscode, lockNow, flush, erase],
  )

  // Lock again after time away, or time untouched.
  useEffect(() => {
    if (phase.kind !== 'open' || !hasPasscode) return
    let hiddenAt = 0
    let lastActive = Date.now()
    const onVisibility = () => {
      if (document.hidden) hiddenAt = Date.now()
      else if (hiddenAt && Date.now() - hiddenAt > AWAY_MS) void lockNow()
    }
    const onActivity = () => {
      lastActive = Date.now()
    }
    const timer = window.setInterval(() => {
      if (!document.hidden && Date.now() - lastActive > IDLE_MS) void lockNow()
    }, 15_000)
    document.addEventListener('visibilitychange', onVisibility)
    for (const name of ['pointerdown', 'keydown', 'scroll'] as const) {
      window.addEventListener(name, onActivity, { passive: true })
    }
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
      for (const name of ['pointerdown', 'keydown', 'scroll'] as const) {
        window.removeEventListener(name, onActivity)
      }
    }
  }, [phase.kind, hasPasscode, lockNow])

  // The store sets theme and language once open; the lock screen needs them first.
  useEffect(() => {
    if (phase.kind !== 'locked') return
    const root = document.documentElement
    if (phase.prefs.theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', phase.prefs.theme)
    root.lang = phase.prefs.language
  }, [phase])

  if (phase.kind === 'loading') return null

  if (phase.kind === 'locked') {
    return (
      <LockScreen
        lang={phase.prefs.language}
        onUnlock={(passcode) => unlock(phase.record, passcode)}
        onErase={erase}
      />
    )
  }

  return (
    <SecurityContext.Provider value={security}>
      <StoreProvider
        key={phase.generation}
        initial={phase.state}
        persist={persist}
        saveError={saveError}
      >
        {children}
      </StoreProvider>
    </SecurityContext.Provider>
  )
}

