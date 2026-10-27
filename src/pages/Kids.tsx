import { useState } from 'react'
import { IconBag, IconPlus } from '../components/icons'
import {
  Button,
  Card,
  EmptyState,
  Field,
  SectionTitle,
  Sheet,
  cx,
} from '../components/ui'
import { ageFrom, initials } from '../lib/format'
import { useI18n } from '../lib/i18n'
import { useApp } from '../lib/store'
import type { Kid } from '../lib/types'

export default function Kids() {
  const { state, actions } = useApp()
  const { t } = useI18n()
  const [editing, setEditing] = useState<Kid | 'new' | null>(null)

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="wide text-2xl font-semibold tracking-[-0.015em]">
          {t('kids.title')}
        </h1>
        <Button size="sm" onClick={() => setEditing('new')}>
          <IconPlus width={16} height={16} />
          {t('common.add')}
        </Button>
      </div>

      {state.kids.length === 0 ? (
        <EmptyState
          title={t('kids.emptyTitle')}
          body={t('kids.emptyBody')}
          action={
            <Button variant="primary" size="sm" onClick={() => setEditing('new')}>
              {t('kids.addChild')}
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {state.kids.map((kid) => {
            const age = ageFrom(kid.birthdate)
            const items = state.bag.filter((item) => item.kidId === kid.id)
            return (
              <Card as="li" key={kid.id}>
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sunken text-base font-semibold text-muted">
                    {kid.emoji || initials(kid.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate font-semibold">{kid.name}</p>
                      <button
                        type="button"
                        onClick={() => setEditing(kid)}
                        className="shrink-0 text-xs text-muted hover:text-ink"
                      >
                        {t('common.edit')}
                      </button>
                    </div>
                    {age !== null ? (
                      <p className="text-xs text-muted">{t('kids.yearsOld', { count: age })}</p>
                    ) : null}

                    <dl className="mt-3 space-y-1.5 text-sm">
                      {kid.school ? <Detail label={t('kids.school')} value={kid.school} /> : null}
                      {kid.doctor ? <Detail label={t('kids.doctor')} value={kid.doctor} /> : null}
                      {kid.allergies ? (
                        <Detail label={t('kids.allergies')} value={kid.allergies} emphasis />
                      ) : null}
                      {kid.notes ? <Detail label={t('kids.notes')} value={kid.notes} /> : null}
                    </dl>
                  </div>
                </div>

                <BagList kidId={kid.id} items={items} />
              </Card>
            )
          })}
        </ul>
      )}

      {state.bag.some((item) => item.packed) ? (
        <button
          type="button"
          onClick={actions.resetBag}
          className="w-full px-1 text-center text-xs text-muted hover:text-ink"
        >
          {t('kids.clearPacked')}
        </button>
      ) : null}

      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? t('kids.addChild') : t('kids.editDetails')}
      >
        {editing !== null ? (
          <KidForm
            kid={editing === 'new' ? null : editing}
            onDone={() => setEditing(null)}
            key={editing === 'new' ? 'new' : editing.id}
          />
        ) : null}
      </Sheet>
    </div>
  )
}

function Detail({
  label,
  value,
  emphasis,
}: {
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-xs text-faint">{label}</dt>
      <dd className={cx('min-w-0 flex-1', emphasis ? 'font-medium text-danger' : 'text-muted')}>
        {value}
      </dd>
    </div>
  )
}

function BagList({
  kidId,
  items,
}: {
  kidId: string
  items: { id: string; label: string; packed: boolean }[]
}) {
  const { actions } = useApp()
  const { t } = useI18n()
  const [adding, setAdding] = useState('')

  return (
    <div className="mt-4 border-t border-line pt-3">
      <SectionTitle>
        <span className="flex items-center gap-1.5">
          <IconBag width={14} height={14} />
          {t('kids.travelsBetweenHomes')}
        </span>
      </SectionTitle>
      {items.length > 0 ? (
        <ul className="mb-2 space-y-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => actions.toggleBagItem(item.id)}
                className="flex flex-1 items-center gap-2 rounded-lg px-1 py-1 text-left text-sm hover:bg-sunken"
              >
                <span
                  className={cx(
                    'flex size-4 shrink-0 items-center justify-center rounded border',
                    item.packed ? 'border-ink bg-ink text-paper' : 'border-line',
                  )}
                  aria-hidden
                >
                  {item.packed ? '✓' : ''}
                </span>
                <span className={cx(item.packed && 'text-faint line-through')}>{item.label}</span>
              </button>
              <button
                type="button"
                onClick={() => actions.removeBagItem(item.id)}
                className="px-1 text-xs text-faint hover:text-danger"
                aria-label={t('kids.removeItem', { label: item.label })}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (!adding.trim()) return
          actions.addBagItem({ kidId, label: adding.trim() })
          setAdding('')
        }}
      >
        <input
          className="field py-1.5 text-sm"
          value={adding}
          onChange={(e) => setAdding(e.target.value)}
          placeholder={t('kids.addItem')}
        />
      </form>
    </div>
  )
}

function KidForm({ kid, onDone }: { kid: Kid | null; onDone: () => void }) {
  const { actions } = useApp()
  const { t } = useI18n()
  const [form, setForm] = useState({
    name: kid?.name ?? '',
    birthdate: kid?.birthdate ?? '',
    emoji: kid?.emoji ?? '',
    school: kid?.school ?? '',
    doctor: kid?.doctor ?? '',
    allergies: kid?.allergies ?? '',
    notes: kid?.notes ?? '',
  })

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!form.name.trim()) return
        const payload = {
          name: form.name.trim(),
          birthdate: form.birthdate || undefined,
          emoji: form.emoji.trim() || undefined,
          school: form.school.trim() || undefined,
          doctor: form.doctor.trim() || undefined,
          allergies: form.allergies.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }
        if (kid) actions.updateKid(kid.id, payload)
        else actions.addKid(payload)
        onDone()
      }}
    >
      <div className="grid grid-cols-[1fr_5rem] gap-3">
        <Field label={t('kids.name')}>
          <input
            className="field"
            value={form.name}
            onChange={(e) => set('name')(e.target.value)}
            autoFocus
          />
        </Field>
        <Field label={t('kids.initial')}>
          <input
            className="field text-center"
            maxLength={2}
            value={form.emoji}
            onChange={(e) => set('emoji')(e.target.value)}
            placeholder="M"
          />
        </Field>
      </div>
      <Field label={t('kids.dateOfBirth')}>
        <input
          type="date"
          className="field"
          value={form.birthdate}
          onChange={(e) => set('birthdate')(e.target.value)}
        />
      </Field>
      <Field label={t('kids.schoolOrNursery')}>
        <input
          className="field"
          value={form.school}
          onChange={(e) => set('school')(e.target.value)}
        />
      </Field>
      <Field label={t('kids.doctor')}>
        <input
          className="field"
          value={form.doctor}
          onChange={(e) => set('doctor')(e.target.value)}
        />
      </Field>
      <Field label={t('kids.allergiesLabel')} hint={t('kids.allergiesHint')}>
        <input
          className="field"
          value={form.allergies}
          onChange={(e) => set('allergies')(e.target.value)}
        />
      </Field>
      <Field label={t('kids.notes')}>
        <textarea
          className="field"
          rows={3}
          value={form.notes}
          onChange={(e) => set('notes')(e.target.value)}
          placeholder={t('kids.notesPlaceholder')}
        />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" block>
          {kid ? t('common.save') : t('kids.addChild')}
        </Button>
        {kid ? (
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              actions.removeKid(kid.id)
              onDone()
            }}
          >
            {t('common.remove')}
          </Button>
        ) : null}
      </div>
    </form>
  )
}
