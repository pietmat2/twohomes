import { useRef, useState } from 'react'
import { getISOWeek } from 'date-fns'
import { IconCamera, IconPlus } from '../components/icons'
import { Button, Card, EmptyState, Field, Pill, Sheet, cx } from '../components/ui'
import { daySpoken } from '../lib/format'
import { toISO } from '../lib/schedule'
import { fileToPhoto } from '../lib/storage'
import { nameOf, useApp } from '../lib/store'

/**
 * Low-effort, low-cost things to do with a child. Deliberately ordinary: the
 * point is a nudge, not a competition between the two homes.
 */
const IDEAS = [
  'Cook one thing together where they do the measuring.',
  'Walk a route neither of you has taken before.',
  'Let them pick the music for the whole car journey.',
  'Build something out of whatever is in the recycling.',
  'Ask them to teach you a game they like.',
  'Go somewhere with water, even just a puddle.',
  'Draw each other without looking at the paper.',
  'Make a list together of places to go this year.',
  'Read the same book, five minutes each.',
  'Find ten things outside of one colour.',
  'Plan next weekend with them, out loud.',
  'Do nothing in particular, with the screens off.',
]

export default function Moments() {
  const { state, actions, me } = useApp()
  const [open, setOpen] = useState(false)
  const [kidFilter, setKidFilter] = useState('all')

  const idea = IDEAS[getISOWeek(new Date()) % IDEAS.length]

  const moments = [...state.moments]
    .filter((m) => kidFilter === 'all' || m.kidIds.includes(kidFilter))
    .sort((x, y) => y.createdAt.localeCompare(x.createdAt))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.015em]">Moments</h1>
          <p className="text-sm text-muted">
            Ordinary days from whichever home they are in.
          </p>
        </div>
        <Button size="sm" variant="primary" onClick={() => setOpen(true)}>
          <IconPlus width={16} height={16} />
          Share
        </Button>
      </div>

      <div className="border-l-2 border-line pl-4">
        <p className="font-display text-[1.0625rem] italic">{idea}</p>
        <p className="mt-1 text-sm text-faint">Something to do together this week.</p>
      </div>

      {state.kids.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {[{ id: 'all', name: 'Everyone' }, ...state.kids].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setKidFilter(option.id)}
              className={cx(
                'rounded-full border px-3 py-1.5 text-sm transition',
                kidFilter === option.id
                  ? 'border-ink bg-ink text-paper'
                  : 'border-line text-muted hover:bg-sunken',
              )}
            >
              {option.name}
            </button>
          ))}
        </div>
      ) : null}

      {moments.length === 0 ? (
        <EmptyState
          title="Nothing shared yet"
          body="A photo and one line is enough. The other home sees the days they were not there for."
          action={
            <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
              Share something
            </Button>
          }
        />
      ) : (
        <ul className="space-y-4">
          {moments.map((moment) => {
            const mine = moment.by === me
            const kids = state.kids.filter((k) => moment.kidIds.includes(k.id))
            return (
              <Card as="li" key={moment.id} className="overflow-hidden p-0">
                {moment.photo ? (
                  <img
                    src={moment.photo}
                    alt={moment.caption ?? 'Shared photo'}
                    className="max-h-96 w-full object-cover"
                  />
                ) : null}
                <div className="p-4">
                  {moment.caption ? (
                    <p className="text-[0.9375rem] leading-relaxed">{moment.caption}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
                    <span>
                      {nameOf(state, moment.by)}, {daySpoken(moment.date)}
                      {kids.length > 0 ? `, with ${kids.map((k) => k.name).join(' and ')}` : ''}
                    </span>
                    {!mine && !moment.seenByOther ? <Pill tone="warn">New</Pill> : null}
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    {!mine && !moment.seenByOther ? (
                      <button
                        type="button"
                        onClick={() => actions.markMomentSeen(moment.id)}
                        className="text-xs font-medium text-muted hover:text-ink"
                      >
                        Mark as seen
                      </button>
                    ) : null}
                    {mine ? (
                      <button
                        type="button"
                        onClick={() => actions.removeMoment(moment.id)}
                        className="text-xs text-muted hover:text-danger"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
              </Card>
            )
          })}
        </ul>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Share a moment">
        <MomentForm onDone={() => setOpen(false)} />
      </Sheet>
    </div>
  )
}

function MomentForm({ onDone }: { onDone: () => void }) {
  const { state, actions, me } = useApp()
  const [caption, setCaption] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [kidIds, setKidIds] = useState<string[]>(state.kids.map((k) => k.id))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function pick(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      setPhoto(await fileToPhoto(file))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not use that image.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!caption.trim() && !photo) return
        actions.addMoment({
          date: toISO(new Date()),
          by: me,
          caption: caption.trim() || undefined,
          photo: photo ?? undefined,
          kidIds,
        })
        onDone()
      }}
    >
      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void pick(e.target.files?.[0])}
        />
        {photo ? (
          <div className="relative">
            <img src={photo} alt="" className="max-h-64 w-full rounded-xl object-cover" />
            <button
              type="button"
              onClick={() => setPhoto(null)}
              className="absolute top-2 right-2 rounded-lg bg-black/55 px-2 py-1 text-xs text-white"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-line py-8 text-muted hover:bg-sunken"
          >
            <IconCamera />
            <span className="text-sm">{busy ? 'Working…' : 'Add a photo'}</span>
          </button>
        )}
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      </div>

      <Field label="Say something" hint="One line is plenty.">
        <textarea
          className="field"
          rows={3}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="She finally landed the cartwheel."
        />
      </Field>

      {state.kids.length > 0 ? (
        <Field label="Who is in it">
          <div className="flex flex-wrap gap-2">
            {state.kids.map((kid) => {
              const on = kidIds.includes(kid.id)
              return (
                <button
                  key={kid.id}
                  type="button"
                  onClick={() =>
                    setKidIds((prev) =>
                      on ? prev.filter((id) => id !== kid.id) : [...prev, kid.id],
                    )
                  }
                  className={cx(
                    'rounded-full border px-3 py-1.5 text-sm transition',
                    on ? 'border-ink bg-ink text-paper' : 'border-line text-muted hover:bg-sunken',
                  )}
                >
                  {kid.name}
                </button>
              )
            })}
          </div>
        </Field>
      ) : null}

      <Button type="submit" variant="primary" block disabled={!caption.trim() && !photo}>
        Share with {state.parents[me === 'a' ? 'b' : 'a'].name}
      </Button>
      <p className="text-center text-xs text-muted">
        Photos stay on this device in this build. Nothing is uploaded anywhere.
      </p>
    </form>
  )
}
