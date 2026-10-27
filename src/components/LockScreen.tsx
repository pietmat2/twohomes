import { useEffect, useState, type FormEvent } from 'react'
import { translate, type Vars } from '../lib/i18n'
import type { MessageKey } from '../lib/messages/en'
import { readAttempts, recordFailure, type Attempts } from '../lib/storage'
import type { Lang } from '../lib/types'
import { WrongPasscodeError } from '../lib/vault'
import { Button, Field } from './ui'

/**
 * Shown instead of the app while the data is encrypted. It renders before
 * there is any state, so it takes the language as a prop and translates
 * without the store.
 */
export function LockScreen({
  lang,
  onUnlock,
  onErase,
}: {
  lang: Lang
  onUnlock: (passcode: string) => Promise<void>
  onErase: () => Promise<void>
}) {
  const t = (key: MessageKey, vars?: Vars) => translate(lang, key, vars)
  const [passcode, setPasscode] = useState('')
  const [busy, setBusy] = useState(false)
  const [wrong, setWrong] = useState(false)
  const [attempts, setAttempts] = useState<Attempts>({ failures: 0, until: 0 })
  const [now, setNow] = useState(() => Date.now())
  const [forgot, setForgot] = useState(false)

  useEffect(() => {
    void readAttempts().then(setAttempts)
  }, [])

  const waitSeconds = Math.max(0, Math.ceil((attempts.until - now) / 1000))

  useEffect(() => {
    if (attempts.until <= Date.now()) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [attempts.until])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy || waitSeconds > 0 || !passcode) return
    setBusy(true)
    try {
      await onUnlock(passcode)
    } catch (error) {
      if (!(error instanceof WrongPasscodeError)) throw error
      setWrong(true)
      setPasscode('')
      setAttempts(await recordFailure(attempts))
      setNow(Date.now())
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-14">
      <p className="wide text-lg font-semibold">Twohomes</p>
      <h1 className="wide mt-12 text-2xl font-semibold">{t('lock.title')}</h1>
      <p className="mt-3 text-base text-muted">{t('lock.body')}</p>

      <form className="mt-8 space-y-5" onSubmit={(event) => void submit(event)}>
        <Field label={t('lock.passcode')}>
          <input
            type="password"
            className="field"
            autoComplete="current-password"
            autoFocus
            value={passcode}
            onChange={(event) => {
              setPasscode(event.target.value)
              setWrong(false)
            }}
          />
        </Field>
        {waitSeconds > 0 ? (
          <p className="text-sm text-danger" role="alert">
            {t('lock.wait', { count: waitSeconds })}
          </p>
        ) : wrong ? (
          <p className="text-sm text-danger" role="alert">
            {t('lock.wrong')}
          </p>
        ) : null}
        <Button type="submit" variant="primary" block disabled={busy || waitSeconds > 0 || !passcode}>
          {busy ? t('common.working') : t('lock.unlock')}
        </Button>
      </form>

      <p className="mt-10 text-sm text-faint">{t('lock.encrypted')}</p>

      <div className="mt-8 border-t border-line pt-5">
        {forgot ? (
          <div className="space-y-5">
            <p className="text-sm text-muted">{t('lock.forgotBody')}</p>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                if (confirm(t('lock.eraseConfirm'))) void onErase()
              }}
            >
              {t('lock.erase')}
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setForgot(true)}
            className="text-sm text-muted underline underline-offset-4 hover:text-ink"
          >
            {t('lock.forgot')}
          </button>
        )}
      </div>
    </main>
  )
}
