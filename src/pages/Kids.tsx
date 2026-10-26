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
import { ageFrom, initials, pluralise } from '../lib/format'
import { useApp } from '../lib/store'
import type { Kid } from '../lib/types'

export default function Kids() {
  const { state, actions } = useApp()
  const [editing, setEditing] = useState<Kid | 'new' | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold tracking-[-0.015em]">Children</h1>
        <Button size="sm" onClick={() => setEditing('new')}>
          <IconPlus width={16} height={16} />
          Add
        </Button>
      </div>

      {state.kids.length === 0 ? (
        <EmptyState
          title="No children added"
          body="Everything else in the app hangs off this: nights, costs, events and the bag list."
          action={
            <Button variant="primary" size="sm" onClick={() => setEditing('new')}>
              Add a child
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
                        Edit
                      </button>
                    </div>
                    {age !== null ? (
                      <p className="text-xs text-muted">{pluralise(age, 'year old', 'years old')}</p>
                    ) : null}

                    <dl className="mt-3 space-y-1.5 text-sm">
                      {kid.school ? <Detail label="School" value={kid.school} /> : null}
                      {kid.doctor ? <Detail label="Doctor" value={kid.doctor} /> : null}
                      {kid.allergies ? (
                        <Detail label="Allergies" value={kid.allergies} emphasis />
                      ) : null}
                      {kid.notes ? <Detail label="Notes" value={kid.notes} /> : null}
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
          Clear all packed ticks for the next handover
        </button>
      ) : null}

      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add a child' : 'Edit details'}
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
  const [adding, setAdding] = useState('')

  return (
    <div className="mt-4 border-t border-line pt-3">
      <SectionTitle>
        <span className="flex items-center gap-1.5">
          <IconBag width={14} height={14} />
          Travels between homes
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
                aria-label={`Remove ${item.label}`}
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
          placeholder="Add an item…"
        />
      </form>
    </div>
  )
}

function KidForm({ kid, onDone }: { kid: Kid | null; onDone: () => void }) {
  const { actions } = useApp()
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
        <Field label="Name">
          <input
            className="field"
            value={form.name}
            onChange={(e) => set('name')(e.target.value)}
            autoFocus
          />
        </Field>
        <Field label="Initial">
          <input
            className="field text-center"
            maxLength={2}
            value={form.emoji}
            onChange={(e) => set('emoji')(e.target.value)}
            placeholder="M"
          />
        </Field>
      </div>
      <Field label="Date of birth">
        <input
          type="date"
          className="field"
          value={form.birthdate}
          onChange={(e) => set('birthdate')(e.target.value)}
        />
      </Field>
      <Field label="School or nursery">
        <input
          className="field"
          value={form.school}
          onChange={(e) => set('school')(e.target.value)}
        />
      </Field>
      <Field label="Doctor">
        <input
          className="field"
          value={form.doctor}
          onChange={(e) => set('doctor')(e.target.value)}
        />
      </Field>
      <Field label="Allergies and medication" hint="Shown to both homes, in red.">
        <input
          className="field"
          value={form.allergies}
          onChange={(e) => set('allergies')(e.target.value)}
        />
      </Field>
      <Field label="Notes">
        <textarea
          className="field"
          rows={3}
          value={form.notes}
          onChange={(e) => set('notes')(e.target.value)}
          placeholder="Routines, comfort items, anything that helps the other home."
        />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" block>
          {kid ? 'Save' : 'Add child'}
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
            Remove
          </Button>
        ) : null}
      </div>
    </form>
  )
}
