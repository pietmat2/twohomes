import { useRef, useState } from 'react'
import { Button, Card, Field, SectionTitle, Segmented, cx } from '../components/ui'
import { LANGUAGES, useI18n } from '../lib/i18n'
import { PATTERNS, nightsSplit } from '../lib/schedule'
import { blankState, demoState } from '../lib/seed'
import { exportState, importState, storageFootprintKb } from '../lib/storage'
import { useApp } from '../lib/store'
import type { Lang, ParentId, PatternId } from '../lib/types'

/** Kept independent of the language: a Polish speaker in Denmark pays in DKK. */
const CURRENCIES = ['DKK', 'PLN', 'EUR', 'SEK', 'NOK', 'GBP', 'USD']

export default function Settings() {
  const { state, actions, me } = useApp()
  const { t } = useI18n()
  const [importError, setImportError] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const split = nightsSplit(state, new Date(), 28)

  function download() {
    const blob = new Blob([exportState(state)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `twohomes-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function upload(file: File | undefined) {
    if (!file) return
    const next = importState(await file.text())
    if (!next) {
      setImportError(true)
      return
    }
    setImportError(false)
    actions.replaceState(next)
  }

  return (
    <div className="space-y-12">
      <h1 className="wide text-2xl font-semibold">
        {t('settings.title')}
      </h1>

      <section>
        <SectionTitle>{t('settings.twoHomes')}</SectionTitle>
        <Card className="space-y-6">
          {(['a', 'b'] as ParentId[]).map((id) => (
            <div key={id} className="flex items-center gap-4">
              <span
                className={cx(
                  'size-3 shrink-0 rounded-full',
                  id === 'a' ? 'bg-home-a' : 'bg-home-b',
                )}
                aria-hidden
              />
              <input
                className="field"
                value={state.parents[id].name}
                onChange={(e) => actions.setParent(id, { name: e.target.value })}
                aria-label={t(
                  id === 'a' ? 'settings.firstParentName' : 'settings.secondParentName',
                )}
              />
            </div>
          ))}
          <Field label={t('settings.iAm')} hint={t('settings.iAmHint')}>
            <Segmented<ParentId>
              value={me}
              onChange={actions.setMe}
              options={[
                { value: 'a', label: state.parents.a.name },
                { value: 'b', label: state.parents.b.name },
              ]}
            />
          </Field>
        </Card>
      </section>

      <section>
        <SectionTitle>{t('settings.schedule')}</SectionTitle>
        <Card className="space-y-6">
          <Field
            label={t('settings.pattern')}
            hint={t(`pattern.${state.schedule.patternId}.summary`)}
          >
            <select
              className="field"
              value={state.schedule.patternId}
              onChange={(e) => actions.setSchedule({ patternId: e.target.value as PatternId })}
            >
              {PATTERNS.map((option) => (
                <option key={option.id} value={option.id}>
                  {t(`pattern.${option.id}.label`)}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-5">
            <Field
              label={t('settings.cycleStarts')}
              hint={t(`pattern.${state.schedule.patternId}.anchor`)}
            >
              <input
                type="date"
                className="field"
                value={state.schedule.anchorDate}
                onChange={(e) => actions.setSchedule({ anchorDate: e.target.value })}
              />
            </Field>
            <Field label={t('settings.changeoverTime')}>
              <input
                type="time"
                className="field"
                value={state.schedule.handoverTime}
                onChange={(e) => actions.setSchedule({ handoverTime: e.target.value })}
              />
            </Field>
          </div>

          <Field label={t('settings.startingHome')} hint={t('settings.startingHomeHint')}>
            <Segmented<ParentId>
              value={state.schedule.startParent}
              onChange={(next) => actions.setSchedule({ startParent: next })}
              options={[
                { value: 'a', label: state.parents.a.name },
                { value: 'b', label: state.parents.b.name },
              ]}
            />
          </Field>

          <Field label={t('settings.changeoverPlace')}>
            <input
              className="field"
              value={state.schedule.handoverPlace ?? ''}
              onChange={(e) => actions.setSchedule({ handoverPlace: e.target.value })}
              placeholder={t('settings.changeoverPlacePlaceholder')}
            />
          </Field>

          <p className="text-sm text-muted">
            {t('settings.splitPreview', {
              nameA: state.parents.a.name,
              nightsA: t('common.nights', { count: split.a }),
              nameB: state.parents.b.name,
              nightsB: t('common.nights', { count: split.b }),
            })}
          </p>
        </Card>
      </section>

      <section>
        <SectionTitle>{t('settings.display')}</SectionTitle>
        <Card className="space-y-6">
          <Field label={t('settings.language')} hint={t('settings.languageHint')}>
            <select
              className="field"
              value={state.language}
              onChange={(e) => actions.setLanguage(e.target.value as Lang)}
            >
              {LANGUAGES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('settings.currency')} hint={t('settings.currencyHint')}>
            <select
              className="field"
              value={state.currency}
              onChange={(e) => actions.setPreferences({ currency: e.target.value })}
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('settings.theme')}>
            <Segmented
              value={state.theme}
              onChange={(theme) => actions.setPreferences({ theme })}
              options={[
                { value: 'system', label: t('settings.themeSystem') },
                { value: 'light', label: t('settings.themeLight') },
                { value: 'dark', label: t('settings.themeDark') },
              ]}
            />
          </Field>
        </Card>
      </section>

      <section>
        <SectionTitle>{t('settings.yourData')}</SectionTitle>
        <Card className="space-y-6">
          <p className="text-sm text-muted">{t('settings.dataBody')}</p>
          <p className="text-sm text-faint">
            {t('settings.storageSize', { size: storageFootprintKb(state) })}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="sm" onClick={download}>
              {t('settings.exportCopy')}
            </Button>
            <Button size="sm" onClick={() => fileRef.current?.click()}>
              {t('settings.importFile')}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => void upload(e.target.files?.[0])}
            />
          </div>
          {importError ? (
            <p className="text-sm text-danger">{t('settings.importFailed')}</p>
          ) : null}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => actions.replaceState(demoState(state.language))}
            >
              {t('settings.reloadDemo')}
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                if (confirm(t('settings.startEmptyConfirm'))) {
                  actions.replaceState(blankState(state.language))
                }
              }}
            >
              {t('settings.startEmpty')}
            </Button>
          </div>
        </Card>
      </section>

      <p className="pb-4 text-sm text-faint">{t('settings.disclaimer')}</p>
    </div>
  )
}
