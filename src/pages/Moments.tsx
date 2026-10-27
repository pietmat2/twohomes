import { useRef, useState } from 'react'
import { getISOWeek } from 'date-fns'
import { IconCamera, IconPlus } from '../components/icons'
import { Button, EmptyState, Field, Pill, Sheet, cx } from '../components/ui'
import { useI18n } from '../lib/i18n'
import { toISO } from '../lib/schedule'
import { fileToPhoto } from '../lib/storage'
import { nameOf, useApp } from '../lib/store'

/**
 * Low-effort, low-cost things to do with a child. Deliberately ordinary: the
 * point is a nudge, not a competition between the two homes. The wording for
 * each lives in the catalogues under `idea.1` … `idea.12`.
 */
const IDEA_KEYS = [
  'idea.1',
  'idea.2',
  'idea.3',
  'idea.4',
  'idea.5',
  'idea.6',
  'idea.7',
  'idea.8',
  'idea.9',
  'idea.10',
  'idea.11',
  'idea.12',
] as const

export default function Moments() {
  const { state, actions, me } = useApp()
  const { t, daySpoken, joinList } = useI18n()
  const [open, setOpen] = useState(false)
  const [kidFilter, setKidFilter] = useState('all')

  const idea = t(IDEA_KEYS[getISOWeek(new Date()) % IDEA_KEYS.length])

  const moments = [...state.moments]
    .filter((m) => kidFilter === 'all' || m.kidIds.includes(kidFilter))
    .sort((x, y) => y.createdAt.localeCompare(x.createdAt))

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="wide text-2xl font-semibold">
            {t('moments.title')}
          </h1>
          <p className="text-sm text-muted">{t('moments.subtitle')}</p>
        </div>
        <Button size="sm" variant="primary" onClick={() => setOpen(true)}>
          <IconPlus width={16} height={16} />
          {t('moments.share')}
        </Button>
      </div>

      <div className="border-l-2 border-line pl-4">
        <p className="wide text-xl italic">{idea}</p>
        <p className="mt-1 text-sm text-faint">{t('moments.ideaCaption')}</p>
      </div>

      {state.kids.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {[{ id: 'all', name: t('common.everyone') }, ...state.kids].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setKidFilter(option.id)}
              className={cx(
                'rounded-card border px-3 py-2 text-sm transition-colors',
                kidFilter === option.id
                  ? 'border-ink bg-ink text-paper'
                  : 'border-line text-muted hover:text-ink',
              )}
            >
              {option.name}
            </button>
          ))}
        </div>
      ) : null}

      {moments.length === 0 ? (
        <EmptyState
          title={t('moments.emptyTitle')}
          body={t('moments.emptyBody')}
          action={
            <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
              {t('moments.shareSomething')}
            </Button>
          }
        />
      ) : (
        <ul className="space-y-10">
          {moments.map((moment) => {
            const mine = moment.by === me
            const kids = state.kids.filter((k) => moment.kidIds.includes(k.id))
            return (
              <li key={moment.id} className="border-t border-line pt-6">
                {moment.photo ? (
                  <img
                    src={moment.photo}
                    alt={moment.caption ?? t('moments.sharedPhoto')}
                    className="mb-4 max-h-96 w-full rounded-card object-cover"
                  />
                ) : null}
                <div>
                  {moment.caption ? (
                    <p className="text-base leading-relaxed">{moment.caption}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
                    <span>
                      {kids.length > 0
                        ? t('moments.bylineWithKids', {
                            name: nameOf(state, moment.by, t('common.you')),
                            day: daySpoken(moment.date),
                            kids: joinList(kids.map((k) => k.name)),
                          })
                        : t('moments.byline', {
                            name: nameOf(state, moment.by, t('common.you')),
                            day: daySpoken(moment.date),
                          })}
                    </span>
                    {!mine && !moment.seenByOther ? <Pill tone="warn">{t('moments.new')}</Pill> : null}
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    {!mine && !moment.seenByOther ? (
                      <button
                        type="button"
                        onClick={() => actions.markMomentSeen(moment.id)}
                        className="text-sm font-medium text-muted hover:text-ink"
                      >
                        {t('moments.markSeen')}
                      </button>
                    ) : null}
                    {mine ? (
                      <button
                        type="button"
                        onClick={() => actions.removeMoment(moment.id)}
                        className="text-sm text-muted hover:text-danger"
                      >
                        {t('common.remove')}
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title={t('moments.shareTitle')}>
        <MomentForm onDone={() => setOpen(false)} />
      </Sheet>
    </div>
  )
}

function MomentForm({ onDone }: { onDone: () => void }) {
  const { state, actions, me } = useApp()
  const { t } = useI18n()
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
    } catch {
      setError(t('moments.photoFailed'))
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
            <img src={photo} alt="" className="max-h-64 w-full rounded-card object-cover" />
            <button
              type="button"
              onClick={() => setPhoto(null)}
              className="absolute top-3 right-3 rounded-card bg-ink/70 px-3 py-1.5 text-sm text-paper"
            >
              {t('common.remove')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="flex w-full flex-col items-center gap-3 rounded-card border border-dashed border-line py-12 text-muted hover:bg-sunken"
          >
            <IconCamera />
            <span className="text-sm">
              {busy ? t('common.working') : t('moments.addPhoto')}
            </span>
          </button>
        )}
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      </div>

      <Field label={t('moments.saySomething')} hint={t('moments.saySomethingHint')}>
        <textarea
          className="field"
          rows={3}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder={t('moments.captionPlaceholder')}
        />
      </Field>

      {state.kids.length > 0 ? (
        <Field label={t('moments.whoIsInIt')}>
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
                    'rounded-card border px-3 py-2 text-sm transition-colors',
                    on ? 'border-ink bg-ink text-paper' : 'border-line text-muted hover:text-ink',
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
        {t('moments.shareWith', { name: state.parents[me === 'a' ? 'b' : 'a'].name })}
      </Button>
      <p className="text-center text-sm text-muted">{t('moments.localOnly')}</p>
    </form>
  )
}
