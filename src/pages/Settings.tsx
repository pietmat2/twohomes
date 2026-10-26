import { useRef, useState } from 'react'
import { Button, Card, Field, SectionTitle, Segmented, cx } from '../components/ui'
import { PATTERNS, getPattern, nightsSplit } from '../lib/schedule'
import { blankState, demoState } from '../lib/seed'
import { exportState, importState, storageFootprintKb } from '../lib/storage'
import { useApp } from '../lib/store'
import type { ParentId, PatternId } from '../lib/types'

const CURRENCIES = ['DKK', 'EUR', 'SEK', 'NOK', 'GBP', 'USD', 'PLN']
const LOCALES = [
  { value: 'da-DK', label: 'Danish' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'sv-SE', label: 'Swedish' },
  { value: 'pl-PL', label: 'Polish' },
  { value: 'de-DE', label: 'German' },
]

export default function Settings() {
  const { state, actions, me } = useApp()
  const [importError, setImportError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const pattern = getPattern(state.schedule.patternId)
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
      setImportError('That file is not a Twohomes export.')
      return
    }
    setImportError(null)
    actions.replaceState(next)
  }

  return (
    <div className="space-y-7">
      <h1 className="text-lg font-semibold tracking-tight">Settings</h1>

      <section>
        <SectionTitle>The two homes</SectionTitle>
        <Card className="space-y-4">
          {(['a', 'b'] as ParentId[]).map((id) => (
            <div key={id} className="flex items-center gap-3">
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
                aria-label={id === 'a' ? 'First parent name' : 'Second parent name'}
              />
            </div>
          ))}
          <Field label="I am" hint="Switch sides to see the app as the other parent.">
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
        <SectionTitle>Schedule</SectionTitle>
        <Card className="space-y-4">
          <Field label="Pattern" hint={pattern.summary}>
            <select
              className="field"
              value={state.schedule.patternId}
              onChange={(e) => actions.setSchedule({ patternId: e.target.value as PatternId })}
            >
              {PATTERNS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Cycle starts" hint={pattern.anchorHint}>
              <input
                type="date"
                className="field"
                value={state.schedule.anchorDate}
                onChange={(e) => actions.setSchedule({ anchorDate: e.target.value })}
              />
            </Field>
            <Field label="Changeover time">
              <input
                type="time"
                className="field"
                value={state.schedule.handoverTime}
                onChange={(e) => actions.setSchedule({ handoverTime: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Starting home" hint="Who has the children on the first day of the cycle.">
            <Segmented<ParentId>
              value={state.schedule.startParent}
              onChange={(next) => actions.setSchedule({ startParent: next })}
              options={[
                { value: 'a', label: state.parents.a.name },
                { value: 'b', label: state.parents.b.name },
              ]}
            />
          </Field>

          <Field label="Changeover place">
            <input
              className="field"
              value={state.schedule.handoverPlace ?? ''}
              onChange={(e) => actions.setSchedule({ handoverPlace: e.target.value })}
              placeholder="School gate"
            />
          </Field>

          <p className="rounded-xl bg-sunken px-3 py-2 text-xs text-muted">
            Over the next four weeks this gives {state.parents.a.name} {split.a} nights and{' '}
            {state.parents.b.name} {split.b}. Individual days changed on the calendar stay as they
            are.
          </p>
        </Card>
      </section>

      <section>
        <SectionTitle>Display</SectionTitle>
        <Card className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Currency">
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
            <Field label="Date and number format">
              <select
                className="field"
                value={state.locale}
                onChange={(e) => actions.setPreferences({ locale: e.target.value })}
              >
                {LOCALES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Theme">
            <Segmented
              value={state.theme}
              onChange={(theme) => actions.setPreferences({ theme })}
              options={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
          </Field>
        </Card>
      </section>

      <section>
        <SectionTitle>Your data</SectionTitle>
        <Card className="space-y-3">
          <p className="text-sm text-muted">
            Everything lives in this browser, on this device. Nothing is sent anywhere. Export to
            move it, or to keep a copy.
          </p>
          <p className="text-xs text-faint">
            Currently holding about {storageFootprintKb(state)} KB.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={download}>
              Export a copy
            </Button>
            <Button size="sm" onClick={() => fileRef.current?.click()}>
              Import a file
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => void upload(e.target.files?.[0])}
            />
          </div>
          {importError ? <p className="text-sm text-danger">{importError}</p> : null}
          <div className="flex flex-wrap gap-2 border-t border-line pt-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => actions.replaceState(demoState())}
            >
              Reload the demo data
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                if (confirm('Clear everything on this device and start empty?')) {
                  actions.replaceState(blankState())
                }
              }}
            >
              Start empty
            </Button>
          </div>
        </Card>
      </section>

      <p className="px-1 pb-4 text-xs text-faint">
        Twohomes is a planning tool, not legal advice. It records what the two of you agree; it does
        not decide anything.
      </p>
    </div>
  )
}
