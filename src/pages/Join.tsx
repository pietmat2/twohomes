import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui'
import { useI18n } from '../lib/i18n'
import type { MessageKey } from '../lib/messages/en'
import { useApp } from '../lib/store'
import { SyncJoinError, useSync } from '../lib/sync/context'
import { decodeInvite } from '../lib/sync/crypto'

/** Where an invitation link lands, on the other parent's device. */
export default function Join() {
  const { code = '' } = useParams()
  const { state } = useApp()
  const { t } = useI18n()
  const sync = useSync()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<MessageKey | null>(null)
  const invite = decodeInvite(code)

  async function join() {
    setBusy(true)
    setError(null)
    try {
      await sync.join(code)
      navigate('/today', { replace: true })
    } catch (caught) {
      const reason = caught instanceof SyncJoinError ? caught.reason : 'network'
      setError(reason === 'full' ? 'sync.full' : reason === 'bad_link' ? 'sync.badLink' : 'sync.joinFailed')
      setBusy(false)
    }
  }

  const blocked: MessageKey | null =
    sync.status === 'unavailable' ? 'sync.unavailable' : state.sync ? 'sync.alreadySharing' : !invite ? 'sync.badLink' : null

  return (
    <div className="space-y-8">
      <h1 className="wide text-2xl font-semibold">{t('sync.joinTitle')}</h1>
      {blocked ? (
        <>
          <p className="max-w-[48ch] text-base text-muted">{t(blocked)}</p>
          <Link to="/settings" className="text-sm text-muted underline underline-offset-4 hover:text-ink">
            {t('nav.settings')}
          </Link>
        </>
      ) : (
        <>
          <p className="max-w-[48ch] text-base">{t('sync.joinBody', { name: invite!.n })}</p>
          <p className="max-w-[48ch] text-sm text-warn">{t('sync.joinReplace')}</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" disabled={busy} onClick={() => void join()}>
              {busy ? t('common.working') : t('sync.join')}
            </Button>
            <Button variant="ghost" onClick={() => navigate('/today', { replace: true })}>
              {t('sync.notNow')}
            </Button>
          </div>
          {error ? (
            <p className="text-sm text-danger" role="alert">
              {t(error)}
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}
