import { useRef, useState } from 'react'
import { getISOWeek } from 'date-fns'
import { IconCamera, IconPlus } from '../components/icons'
import { Bar, Button, EmptyState, Field, Pill, Sheet, cx, homeStyles } from '../components/ui'
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
  const { state, actions, me, them } = useApp()
  const { t, friendlyDay, daySpoken, joinList } = useI18n()
  const [adding, setAdding] = useState(false)
  const [viewing, setViewing] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'mine' | 'theirs'>('all')

  const idea = t(IDEA_KEYS[getISOWeek(new Date()) % IDEA_KEYS.length])

  const moments = [...state.moments]
    .filter((m) => filter === 'all' || (filter === 'mine') === (m.by === me))
    .sort((x, y) => y.createdAt.localeCompare(x.createdAt))

  // Two columns, filled alternately; tall and short frames take turns so the
  // album never lines up into a grid.
  const columns = [moments.filter((_, i) => i % 2 === 0), moments.filter((_, i) => i % 2 === 1)]
  const current = state.moments.find((m) => m.id === viewing)

  const filters: { value: typeof filter; label: string }[] = [
    { value: 'all', label: t('moments.together') },
    { value: 'mine', label: t('moments.fromYou') },
    { value: 'theirs', label: t('moments.fromThem', { name: state.parents[them].name }) },
  ]

  return (
    <div>
      <Bar
        action={
          <Button size="sm" variant="primary" onClick={() => setAdding(true)}>
            <IconPlus width={14} height={14} strokeWidth={2.5} />
            {t('moments.add')}
          </Button>
        }
      />
      <h1 className="headline mt-[30px] text-hero">{t('moments.title')}</h1>

      <div className="mt-[18px] flex flex-wrap gap-2">
        {filters.map((option) => (
          <Button
            key={option.value}
            size="sm"
            variant={filter === option.value ? 'primary' : 'secondary'}
            aria-pressed={filter === option.value}
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="mt-[18px] rounded-frame bg-sand px-5 py-4">
        <p className="kicker">{t('moments.ideaCaption')}</p>
        <p className="mt-1 text-ui font-extrabold">{idea}</p>
      </div>

      {moments.length === 0 ? (
        <div className="mt-[18px]">
          <EmptyState
            title={t('moments.emptyTitle')}
            body={t('moments.emptyBody')}
            action={
              <Button variant="primary" onClick={() => setAdding(true)}>
                {t('moments.shareSomething')}
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-[18px] grid grid-cols-2 gap-2.5">
          {columns.map((column, c) => (
            <div key={c} className="flex min-w-0 flex-col gap-2.5">
              {column.map((moment, r) => {
                const tall = (r + c) % 2 === 0
                const kids = joinList(
                  state.kids.filter((k) => moment.kidIds.includes(k.id)).map((k) => k.name),
                )
                const unseen = moment.by !== me && !moment.seenByOther
                return (
                  <button
                    key={moment.id}
                    type="button"
                    onClick={() => setViewing(moment.id)}
                    className={cx(
                      'relative flex min-w-0 flex-col gap-2 rounded-frame p-2 pb-3 text-left',
                      homeStyles[moment.by].bg,
                    )}
                  >
                    {moment.photo ? (
                      <img
                        src={moment.photo}
                        alt={moment.caption ?? t('moments.sharedPhoto')}
                        className={cx('w-full rounded-photo object-cover', tall ? 'h-[220px]' : 'h-[140px]')}
                      />
                    ) : null}
                    {moment.caption ? (
                      <p className="line-clamp-4 px-1.5 text-sm leading-tight font-extrabold">
                        {moment.caption}
                      </p>
                    ) : null}
                    <span className="-mt-1 px-1.5 text-xs font-semibold text-muted">
                      {[kids, friendlyDay(moment.date)].filter(Boolean).join(' · ')}
                    </span>
                    {unseen ? (
                      <span className="absolute top-3.5 left-3.5">
                        <Pill tone="warn">{t('moments.new')}</Pill>
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}

      <Sheet
        open={current !== undefined}
        onClose={() => setViewing(null)}
        title={current ? nameOf(state, current.by, t('common.you')) : ''}
      >
        {current ? (
          <div className="space-y-4">
            {current.photo ? (
              <img
                src={current.photo}
                alt={current.caption ?? t('moments.sharedPhoto')}
                className="max-h-[60vh] w-full rounded-photo object-cover"
              />
            ) : null}
            {current.caption ? <p className="text-base font-bold">{current.caption}</p> : null}
            <p className="text-sm text-muted">
              {t('moments.byline', {
                name: nameOf(state, current.by, t('common.you')),
                day: daySpoken(current.date),
              })}
            </p>
            <div className="flex flex-wrap gap-2">
              {current.by !== me && !current.seenByOther ? (
                <Button variant="primary" onClick={() => actions.markMomentSeen(current.id)}>
                  {t('moments.markSeen')}
                </Button>
              ) : null}
              {current.by === me ? (
                <Button
                  variant="danger"
                  onClick={() => {
                    actions.removeMoment(current.id)
                    setViewing(null)
                  }}
                >
                  {t('common.remove')}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Sheet>

      <Sheet open={adding} onClose={() => setAdding(false)} title={t('moments.shareTitle')}>
        <MomentForm onDone={() => setAdding(false)} />
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
            <img src={photo} alt="" className="max-h-64 w-full rounded-photo object-cover" />
            <button
              type="button"
              onClick={() => setPhoto(null)}
              className="absolute top-3 right-3 h-[34px] rounded-full bg-ink px-3.5 text-kicker font-bold text-onink"
            >
              {t('common.remove')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="flex w-full flex-col items-center gap-3 rounded-frame border-2 border-dashed border-line py-12 text-muted hover:bg-sunken"
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
                  aria-pressed={on}
                  className={cx(
                    'h-[34px] rounded-full px-3.5 text-kicker font-bold transition-colors',
                    on ? 'bg-ink text-onink' : 'bg-surface text-ink hover:bg-sunken',
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
      {/* Since sync, a shared moment really does leave this device — sealed. */}
      <p className="text-center text-sm text-muted">
        {state.sync
          ? t('moments.sharedEncrypted', { name: state.parents[me === 'a' ? 'b' : 'a'].name })
          : t('moments.localOnly')}
      </p>
    </form>
  )
}
