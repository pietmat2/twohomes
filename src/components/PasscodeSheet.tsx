import { useState, type FormEvent } from 'react'
import { useI18n } from '../lib/i18n'
import { useSecurity } from '../lib/security'
import { MIN_PASSCODE_LENGTH, WrongPasscodeError } from '../lib/vault'
import type { MessageKey } from '../lib/messages/en'
import { Button, Field, Sheet } from './ui'

export type PasscodeMode = 'set' | 'change' | 'remove'

/** Setting, changing and turning off the passcode: one form, three shapes. */
export function PasscodeSheet({ mode, onClose }: { mode: PasscodeMode | null; onClose: () => void }) {
  const { t } = useI18n()
  return (
    <Sheet
      open={mode !== null}
      onClose={onClose}
      title={t(mode === 'change' ? 'security.change' : mode === 'remove' ? 'security.turnOff' : 'security.set')}
    >
      {/* Keyed so every opening starts with empty fields. */}
      {mode ? <PasscodeForm key={mode} mode={mode} onDone={onClose} /> : null}
    </Sheet>
  )
}

function PasscodeForm({ mode, onDone }: { mode: PasscodeMode; onDone: () => void }) {
  const { t } = useI18n()
  const security = useSecurity()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState<MessageKey | null>(null)
  const [busy, setBusy] = useState(false)

  const needsCurrent = mode !== 'set'
  const needsNew = mode !== 'remove'

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (needsNew && next.length < MIN_PASSCODE_LENGTH) return setError('security.tooShort')
    if (needsNew && next !== repeat) return setError('security.mismatch')
    setBusy(true)
    setError(null)
    try {
      if (mode === 'set') await security.setPasscode(next)
      else if (mode === 'change') await security.changePasscode(current, next)
      else await security.removePasscode(current)
      onDone()
    } catch (caught) {
      setError(caught instanceof WrongPasscodeError ? 'lock.wrong' : 'common.saveFailed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={(event) => void submit(event)}>
      {mode === 'remove' ? <p className="text-base text-muted">{t('security.turnOffBody')}</p> : null}
      {needsCurrent ? (
        <Field label={t('security.current')}>
          <input
            type="password"
            className="field"
            autoComplete="current-password"
            autoFocus
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
          />
        </Field>
      ) : null}
      {needsNew ? (
        <>
          <Field label={t('security.new')} hint={t('security.hint')}>
            <input
              type="password"
              className="field"
              autoComplete="new-password"
              autoFocus={!needsCurrent}
              value={next}
              onChange={(event) => setNext(event.target.value)}
            />
          </Field>
          <Field label={t('security.repeat')}>
            <input
              type="password"
              className="field"
              autoComplete="new-password"
              value={repeat}
              onChange={(event) => setRepeat(event.target.value)}
            />
          </Field>
        </>
      ) : null}
      {mode === 'set' ? <p className="text-sm text-warn">{t('security.noRecovery')}</p> : null}
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {t(error)}
        </p>
      ) : null}
      <Button
        type="submit"
        variant={mode === 'remove' ? 'danger' : 'primary'}
        block
        disabled={busy || (needsCurrent && !current) || (needsNew && !next)}
      >
        {busy ? t('common.working') : t(mode === 'remove' ? 'security.turnOff' : 'common.save')}
      </Button>
    </form>
  )
}
