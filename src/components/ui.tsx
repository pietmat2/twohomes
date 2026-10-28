import { useEffect, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import type { ParentId } from '../lib/types'
import { IconArrowLeft, IconClose } from './icons'

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Tailwind fragments for whichever home a thing belongs to. On this device
 * home-a and home-b are re-pointed so that "me" is lime (see index.css), so
 * the colour always reads as "you" or "the other home".
 */
export const homeStyles: Record<
  ParentId,
  { text: string; bg: string; solid: string; border: string }
> = {
  a: {
    text: 'text-home-a-ink',
    bg: 'bg-home-a',
    solid: 'bg-home-a-strong',
    border: 'border-home-a-strong',
  },
  b: {
    text: 'text-home-b-ink',
    bg: 'bg-home-b',
    solid: 'bg-home-b-strong',
    border: 'border-home-b-strong',
  },
}

/** A rounded surface holding one group of things. Space and soft shapes, no rules. */
export function Card({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'li'
}) {
  return <Tag className={cx('rounded-card bg-surface p-[22px]', className)}>{children}</Tag>
}

/** A list inside a surface: rows divided by soft 1.5px rules, the first one bare. */
export function Rows({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ul className={cx('divide-y-[1.5px] divide-line rounded-card bg-surface px-[22px]', className)}>
      {children}
    </ul>
  )
}

export function Row({
  children,
  className,
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  const content = <div className={cx('flex items-start gap-4 py-3.5', className)}>{children}</div>
  if (!onClick) return <li>{content}</li>
  return (
    <li>
      <button type="button" onClick={onClick} className="w-full text-left">
        {content}
      </button>
    </li>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4 px-1">
      <h2 className="wide text-xl">{children}</h2>
      {action}
    </div>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  block?: boolean
}

/** Every action is a pill: ink for the one thing to do, white beside it, an outline for "later". */
export function Button({
  variant = 'secondary',
  size = 'md',
  block,
  className,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-full font-bold whitespace-nowrap transition-[opacity,background-color] active:opacity-80 disabled:pointer-events-none disabled:opacity-40'
  const sizes = { sm: 'h-[34px] px-3.5 text-kicker', md: 'h-11 px-[18px] text-ui' }
  const variants = {
    primary: 'bg-ink text-onink hover:opacity-90',
    secondary: 'bg-surface text-ink hover:bg-sunken',
    ghost: 'bg-transparent text-ink shadow-[inset_0_0_0_1.5px_var(--color-ink)] hover:bg-surface',
    danger: 'bg-surface text-danger hover:bg-sunken',
  }
  return (
    <button
      className={cx(base, sizes[size], variants[variant], block && 'w-full', className)}
      {...props}
    />
  )
}

/** The round 44px button at the top of a screen: back, menu, add. */
export function CircleButton({
  label,
  children,
  tone = 'ink',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: 'ink' | 'surface' }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cx(
        'flex size-11 shrink-0 items-center justify-center rounded-full transition-opacity active:opacity-80',
        tone === 'ink' ? 'bg-ink text-onink hover:opacity-90' : 'bg-surface text-ink hover:bg-sunken',
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/** The row at the top of every screen but Today: back on the left, the screen's one action on the right. */
export function Bar({ action, back = '/today' }: { action?: ReactNode; back?: string }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  return (
    <div className="flex items-center justify-between gap-3">
      <CircleButton label={t('common.back')} onClick={() => navigate(back)}>
        <IconArrowLeft width={20} height={20} strokeWidth={2.5} />
      </CircleButton>
      {action}
    </div>
  )
}

/**
 * The brand mark: a hug drawn in one thick stroke, sitting behind the content
 * in a shade just off the ground. Decoration only.
 */
export function Hug({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 520 620"
      aria-hidden
      className={cx('pointer-events-none absolute z-0 w-[520px]', className)}
      style={style}
    >
      <path
        d="M40 330 C 30 170, 190 80, 260 210 C 330 80, 490 170, 480 330 C 470 470, 330 560, 260 600 M260 600 C 190 560, 120 500, 90 430 C 70 380, 120 340, 170 370 C 210 395, 230 440, 260 470 C 290 440, 310 395, 350 370 C 400 340, 450 380, 430 430"
        fill="none"
        stroke="var(--color-hug)"
        strokeWidth="34"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block px-1 text-kicker font-bold text-muted">{label}</span>
      {children}
      {hint ? <span className="mt-2 block px-1 text-sm text-faint">{hint}</span> : null}
    </label>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (next: T) => void
  options: { value: T; label: ReactNode }[]
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cx(
            // Grow to share a row, never shrink: a label that doesn't fit wraps the
            // row rather than losing its last letters ("Systemowy", "Domyślny").
            'h-[34px] max-w-full flex-[1_0_auto] truncate rounded-full px-3.5 text-kicker font-bold transition-colors',
            value === option.value
              ? 'bg-ink text-onink'
              : 'bg-surface text-ink shadow-[inset_0_0_0_1.5px_var(--color-line)] hover:bg-sunken',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/** A home's colour plus a name, wherever a day or a cost is attributed to a home. */
export function HomeTag({
  parent,
  name,
  className,
}: {
  parent: ParentId
  name: string
  className?: string
}) {
  return (
    <span
      className={cx(
        'inline-flex h-[34px] items-center rounded-full px-3.5 text-kicker font-bold text-ink',
        homeStyles[parent].bg,
        className,
      )}
    >
      {name}
    </span>
  )
}

export function Pill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'a' | 'b' | 'warn'
}) {
  const tones = {
    neutral: 'bg-sand',
    a: 'bg-home-a',
    b: 'bg-home-b',
    warn: 'bg-pink',
  }
  return (
    <span
      className={cx(
        'inline-flex h-6 items-center rounded-full px-2.5 text-xs font-bold whitespace-nowrap text-ink',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-card border-2 border-dashed border-line px-6 py-12 text-center">
      <p className="headline text-[1.875rem] leading-none">{title}</p>
      <p className="mx-auto mt-3 max-w-[34ch] text-ui text-muted">{body}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  )
}

/** Bottom sheet on phones, centred dialog on wider screens. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}) {
  const { t } = useI18n()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label={t('common.close')}
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-sheet relative flex max-h-[90vh] w-full flex-col rounded-t-sheet bg-paper sm:max-w-lg sm:rounded-sheet"
      >
        <header className="flex items-center justify-between gap-4 px-5 pt-5 pb-3">
          <h2 className="wide text-[1.375rem] leading-tight">{title}</h2>
          <CircleButton label={t('common.close')} tone="surface" onClick={onClose}>
            <IconClose width={18} height={18} strokeWidth={2.5} />
          </CircleButton>
        </header>
        <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6">{children}</div>
        {footer ? <div className="px-5 pt-2 pb-5">{footer}</div> : null}
      </div>
    </div>
  )
}
