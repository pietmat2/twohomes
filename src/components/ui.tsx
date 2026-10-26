import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react'
import type { ParentId } from '../lib/types'

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

/** Tailwind fragments for whichever home a thing belongs to. */
export const homeStyles: Record<ParentId, { text: string; bg: string; solid: string; ring: string }> =
  {
    a: {
      text: 'text-home-a',
      bg: 'bg-home-a-soft',
      solid: 'bg-home-a',
      ring: 'ring-home-a',
    },
    b: {
      text: 'text-home-b',
      bg: 'bg-home-b-soft',
      solid: 'bg-home-b',
      ring: 'ring-home-b',
    },
  }

export function Card({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'li'
}) {
  return (
    <Tag
      className={cx(
        'rounded-card border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
        className,
      )}
    >
      {children}
    </Tag>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
      <h2 className="text-xs font-semibold tracking-[0.08em] text-muted uppercase">{children}</h2>
      {action}
    </div>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  block?: boolean
}

export function Button({
  variant = 'secondary',
  size = 'md',
  block,
  className,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-xl font-medium transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45'
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-[0.9375rem]' }
  const variants = {
    primary: 'bg-ink text-paper hover:opacity-90',
    secondary: 'border border-line bg-surface text-ink hover:bg-sunken',
    ghost: 'text-muted hover:bg-sunken hover:text-ink',
    danger: 'border border-line bg-surface text-danger hover:bg-sunken',
  }
  return (
    <button
      className={cx(base, sizes[size], variants[variant], block && 'w-full', className)}
      {...props}
    />
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
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
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
    <div className="flex gap-1 rounded-xl border border-line bg-sunken p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cx(
            'flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition',
            value === option.value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/** A dot plus a name, used wherever a day or a cost is attributed to a home. */
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
    <span className={cx('inline-flex items-center gap-1.5 text-sm', className)}>
      <span className={cx('size-2 rounded-full', homeStyles[parent].solid)} aria-hidden />
      <span>{name}</span>
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
    neutral: 'bg-sunken text-muted',
    a: 'bg-home-a-soft text-home-a',
    b: 'bg-home-b-soft text-home-b',
    warn: 'bg-home-b-soft text-warn',
  }
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
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
    <div className="rounded-card border border-dashed border-line px-6 py-10 text-center">
      <p className="font-medium text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-xs text-sm text-muted">{body}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
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
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-sheet relative flex max-h-[88vh] w-full flex-col rounded-t-3xl border border-line bg-surface sm:max-w-lg sm:rounded-3xl"
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 rounded-lg px-2 py-1 text-muted hover:bg-sunken hover:text-ink"
          >
            Close
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="border-t border-line px-5 py-3">{footer}</div> : null}
      </div>
    </div>
  )
}

export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: ParentId
}) {
  return (
    <div className="rounded-card border border-line bg-surface px-4 py-3">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
      <p className={cx('mt-1 text-xl font-semibold', tone ? homeStyles[tone].text : 'text-ink')}>
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-xs text-muted">{sub}</p> : null}
    </div>
  )
}
