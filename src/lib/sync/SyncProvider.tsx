import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { otherParent } from '../schedule'
import { blankState } from '../seed'
import { useApp } from '../store'
import type { AppState, SyncState } from '../types'
import { POLL_MS, SyncContext, SyncJoinError, type SyncStatus, type SyncValue } from './context'
import {
  decodeInvite,
  encodeInvite,
  newFamilyId,
  newSecret,
  newSigningKeys,
  openOp,
  opKey,
  relayToken,
  sealOp,
} from './crypto'
import { leaveOp, memberChange, memberOp, queueSnapshot, type Op } from './engine'
import { RELAY_URL, RelayError, getOps, joinFamily, leaveFamily, openFamily, postOps } from './relay'

/** Ops per request; the relay accepts up to 500. */
const BATCH = 200

/**
 * Moves operations between this device and the relay: sends the outbox,
 * fetches what the other home sent, and hands it to the store to merge.
 * Runs whenever the outbox grows, every few seconds while the app is in view,
 * and when the device comes back online. Unmounted while the app is locked, so
 * nothing is decrypted or sent behind the lock screen.
 */
export function SyncProvider({ children }: { children: ReactNode }) {
  const { state, actions } = useApp()
  const sync = state.sync
  const [status, setStatus] = useState<SyncStatus>(RELAY_URL ? 'off' : 'unavailable')
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null)

  const latest = useRef<AppState>(state)
  useEffect(() => {
    latest.current = state
  }, [state])

  const running = useRef(false)
  const again = useRef(false)

  const exchange = useCallback(
    async (current: SyncState) => {
      const token = await relayToken(current.secret)
      const key = await opKey(current.secret)

      if (current.outbox.length > 0) {
        const batch = current.outbox.slice(0, BATCH)
        const sealed = await Promise.all(
          batch.map((op) => sealOp(op, key, current.familyId, current.signing.privateKey)),
        )
        await postOps(current.familyId, token, current.device, sealed)
        actions.ackOutbox(batch.map((op) => op.id))
        if (current.outbox.length > batch.length) again.current = true
      }

      let cursor = current.cursor
      const peers = { ...current.peers }
      for (;;) {
        const page = await getOps(current.familyId, token, cursor)
        if (page.ops.length === 0) break
        const ops: Op[] = []
        for (const item of page.ops) {
          cursor = item.seq
          // This device's own ops are already applied here.
          if (item.device === current.device) continue
          const op = await openOp(item.body, key, current.familyId, peers)
          if (!op) continue
          // Track keys as they come, so later ops in the same page verify.
          if (op.kind === 'member') {
            const { publicKey, left } = memberChange(op)
            if (left) delete peers[op.author]
            else if (publicKey && !peers[op.author]) peers[op.author] = publicKey
          }
          ops.push(op)
        }
        actions.applyRemote(ops, cursor)
        if (cursor >= page.last) break
      }
    },
    [actions],
  )

  const run = useCallback(async () => {
    if (running.current) {
      again.current = true
      return
    }
    running.current = true
    setStatus('syncing')
    try {
      do {
        again.current = false
        const current = latest.current.sync
        if (!current || !RELAY_URL) break
        await exchange(current)
        // Let the store's acknowledgements land before reading the outbox again.
        await new Promise((resolve) => setTimeout(resolve, 0))
      } while (again.current)
      setStatus(latest.current.sync ? 'ok' : 'off')
      setLastSyncAt(new Date())
    } catch (error) {
      const offline = !navigator.onLine || error instanceof TypeError
      setStatus(offline ? 'offline' : error instanceof RelayError ? 'error' : 'error')
    } finally {
      running.current = false
    }
  }, [exchange])

  // Send soon after a change, but not once per keystroke.
  const outboxSize = sync?.outbox.length ?? 0
  const familyId = sync?.familyId
  useEffect(() => {
    if (!familyId || !RELAY_URL) return
    const timer = window.setTimeout(() => void run(), outboxSize > 0 ? 400 : 0)
    return () => window.clearTimeout(timer)
  }, [familyId, outboxSize, run])

  useEffect(() => {
    if (!familyId || !RELAY_URL) return
    const poll = window.setInterval(() => {
      if (!document.hidden) void run()
    }, POLL_MS)
    const wake = () => {
      if (!document.hidden) void run()
    }
    document.addEventListener('visibilitychange', wake)
    window.addEventListener('online', wake)
    return () => {
      window.clearInterval(poll)
      document.removeEventListener('visibilitychange', wake)
      window.removeEventListener('online', wake)
    }
  }, [familyId, run])

  const value = useMemo<SyncValue>(
    () => ({
      status: sync ? status : RELAY_URL ? 'off' : 'unavailable',
      lastSyncAt,

      inviteLink() {
        const current = latest.current
        if (!current.sync) return null
        return linkFor(
          encodeInvite({
            v: 1,
            f: current.sync.familyId,
            s: current.sync.secret,
            p: current.me,
            n: current.parents[current.me].name,
          }),
        )
      },

      async invite() {
        const current = latest.current
        const secret = newSecret()
        const familyId = newFamilyId()
        const device = newFamilyId()
        const signing = await newSigningKeys()
        const token = await relayToken(secret)
        await openFamily(familyId, token)
        await joinFamily(familyId, token, device)

        const fresh: SyncState = {
          familyId,
          secret,
          device,
          signing,
          peers: { [current.me]: signing.publicKey },
          clock: { t: 0, c: 0 },
          meta: {},
          outbox: [],
          cursor: 0,
        }
        const member = memberOp(fresh, current.me)
        // Introduce this device, then everything shared so far.
        const started = queueSnapshot({
          ...current,
          sync: { ...fresh, clock: { t: member.stamp.t, c: member.stamp.c }, outbox: [member] },
        })

        // Posted before the link exists, so the joining device always meets
        // this one's key first.
        const key = await opKey(secret)
        const outbox = started.sync!.outbox
        for (let i = 0; i < outbox.length; i += BATCH) {
          const sealed = await Promise.all(
            outbox.slice(i, i + BATCH).map((op) => sealOp(op, key, familyId, signing.privateKey)),
          )
          await postOps(familyId, token, device, sealed)
        }
        actions.startSharing({ ...started, sync: { ...started.sync!, outbox: [] } })
        setStatus('ok')

        return linkFor(
          encodeInvite({ v: 1, f: familyId, s: secret, p: current.me, n: current.parents[current.me].name }),
        )
      },

      async join(code) {
        const invite = decodeInvite(code.trim().replace(/^.*#\/join\//, ''))
        if (!invite) throw new SyncJoinError('bad_link')
        const device = newFamilyId()
        const signing = await newSigningKeys()
        const token = await relayToken(invite.s)
        try {
          await joinFamily(invite.f, token, device)
        } catch (error) {
          if (error instanceof RelayError && error.code === 'full') throw new SyncJoinError('full')
          if (error instanceof RelayError && error.status === 401) throw new SyncJoinError('bad_link')
          throw new SyncJoinError('network')
        }

        const me = otherParent(invite.p)
        const fresh: SyncState = {
          familyId: invite.f,
          secret: invite.s,
          device,
          signing,
          peers: { [me]: signing.publicKey },
          clock: { t: 0, c: 0 },
          meta: {},
          outbox: [],
          cursor: 0,
        }
        const member = memberOp(fresh, me)
        const current = latest.current
        // What this device held is replaced by what the two homes share; the
        // first pull fills it in. Language and theme stay this parent's own.
        actions.joinSharing({
          ...blankState(current.language),
          me,
          theme: current.theme,
          sync: { ...fresh, clock: { t: member.stamp.t, c: member.stamp.c }, outbox: [member] },
        })
      },

      async stop() {
        const current = latest.current.sync
        if (current) {
          try {
            const token = await relayToken(current.secret)
            // Say so first, signed, so the other home stops showing this device as in step.
            const goodbye = await sealOp(
              leaveOp(current, latest.current.me),
              await opKey(current.secret),
              current.familyId,
              current.signing.privateKey,
            )
            await postOps(current.familyId, token, current.device, [goodbye])
            await leaveFamily(current.familyId, token, current.device)
          } catch {
            // Offline: the slot stays taken until the other home starts a new family.
          }
        }
        actions.stopSharing()
        setStatus('off')
      },
    }),
    [sync, status, lastSyncAt, actions],
  )

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
}

/**
 * Where an invitation opens. A web deployment sets VITE_APP_URL so a link
 * made inside the native app still opens somewhere the other parent can reach.
 */
function linkFor(code: string): string {
  const base = import.meta.env.VITE_APP_URL ?? `${location.origin}${location.pathname}`
  return `${base}#/join/${code}`
}
