import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import type { MessageKey } from '../lib/messages/en'
import { useApp } from '../lib/store'
import { useSync } from '../lib/sync/context'
import { isPaired } from '../lib/sync/engine'
import { Button, Card, Field, SectionTitle } from './ui'

/** Settings: invite the other parent, wait for them, or see that both homes are in step. */
export function SharingSection() {
  const { state, them } = useApp()
  const { t, locale } = useI18n()
  const sync = useSync()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<MessageKey | null>(null)
  const [copied, setCopied] = useState(false)
  const [pasted, setPasted] = useState('')

  const shared = state.sync
  const paired = isPaired(shared)
  const link = shared && !paired ? sync.inviteLink() : null

  async function invite() {
    setBusy(true)
    setError(null)
    try {
      await sync.invite()
    } catch {
      setError('sync.inviteFailed')
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // No clipboard permission: the link is selectable in the field.
    }
  }

  function status(): string {
    if (sync.status === 'offline') return t('sync.offline')
    if (sync.status === 'error') return t('sync.error')
    const waiting = shared?.outbox.length ?? 0
    if (waiting > 0) return t('sync.pending', { count: waiting })
    if (!sync.lastSyncAt) return ''
    const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(sync.lastSyncAt)
    return t('sync.lastSynced', { time })
  }

  return (
    <section>
      <SectionTitle>{t('sync.title')}</SectionTitle>
      <Card className="space-y-6">
        {sync.status === 'unavailable' ? (
          <p className="text-sm text-muted">{t('sync.unavailable')}</p>
        ) : !shared ? (
          <>
            <p className="text-sm text-muted">{t('sync.offBody')}</p>
            <Button size="sm" variant="primary" disabled={busy} onClick={() => void invite()}>
              {busy ? t('common.working') : t('sync.invite')}
            </Button>
            <form
              className="space-y-4 border-t border-line pt-5"
              onSubmit={(event) => {
                event.preventDefault()
                const code = pasted.trim().replace(/^.*#\/join\//, '')
                if (code) navigate(`/join/${code}`)
              }}
            >
              <Field label={t('sync.haveInvite')}>
                <input
                  className="field"
                  value={pasted}
                  onChange={(event) => setPasted(event.target.value)}
                  placeholder={t('sync.pasteLabel')}
                  autoComplete="off"
                  spellCheck={false}
                />
              </Field>
              <Button size="sm" type="submit" disabled={!pasted.trim()}>
                {t('sync.open')}
              </Button>
            </form>
          </>
        ) : !paired ? (
          <>
            <p className="text-sm text-muted">{t('sync.waitingBody')}</p>
            <input
              className="field font-mono text-xs"
              readOnly
              value={link ?? ''}
              onFocus={(event) => event.target.select()}
              aria-label={t('sync.pasteLabel')}
            />
            <div className="flex flex-wrap gap-3">
              <Button size="sm" variant="primary" onClick={() => void copy()}>
                {copied ? t('sync.copied') : t('sync.copy')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => void sync.stop()}>
                {t('sync.cancel')}
              </Button>
            </div>
            <p className="text-sm text-faint">{t('sync.waiting')}</p>
          </>
        ) : (
          <>
            <p className="text-base">{t('sync.paired', { name: state.parents[them].name })}</p>
            {status() ? (
              <p className={sync.status === 'offline' || sync.status === 'error' ? 'text-sm text-warn' : 'text-sm text-faint'}>
                {status()}
              </p>
            ) : null}
            <p className="text-sm text-faint">{t('sync.signed')}</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (confirm(t('sync.stopConfirm'))) void sync.stop()
              }}
            >
              {t('sync.stop')}
            </Button>
          </>
        )}
        {error ? (
          <p className="text-sm text-danger" role="alert">
            {t(error)}
          </p>
        ) : null}
      </Card>
    </section>
  )
}
