import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react'
import type { ParentId } from '../lib/types'

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

/** Tailwind fragments for whichever home a thing belongs to. */
export const homeStyles: Record<
  ParentId,
  { text: string; bg: string; solid: string; border: string }
> = {
  a: {
    text: 'text-home-a',
    bg: 'bg-home-a-soft',
    solid: 'bg-home-a',
    border: 'border-home-a',
  },
  b: {
    text: 'text-home-b',
    bg: 'bg-home-b-soft',
    solid: 'bg-home-b',
    border: 'border-home-b',
  },
}

/**
 * A plain bounded area. Deliberately flat: elevation is reserved for things
 * that actually lift off the page, which in this app is only the sheet.
 */
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
    <Tag className={cx('rounded-card border border-line bg-surface p-4', className)}>
      {children}
    </Tag>
  )
}

/** A list whose items are separated by hairlines rather than boxed one by one. */
export function Rows({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ul className={cx('divide-y divide-line border-y border-line', className)}>{children}</ul>
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
  const content = <div className={cx('flex items-start gap-3 py-3', className)}>{children}</div>
  if (!onClick) return <li>{content}</li>
  return (
    <li>
      <button type="button" onClick={onClick} className="w-full text-left hover:bg-sunken">
        {content}
      </button>
    </li>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <h2 className="font-display text-[1.0625rem] font-semibold">{children}</h2>
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
    'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-40'
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-[0.9375rem]' }
  const variants = {
    primary: 'bg-ink text-paper hover:opacity-85',
    secondary: 'border border-line bg-surface hover:bg-sunken',
    ghost: 'text-muted hover:text-ink',
    danger: 'border border-line text-danger hover:bg-sunken',
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
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs text-muted">{hint}</span> : null}
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
    <div className="flex gap-1 rounded-lg border border-line p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cx(
            'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            value === option.value ? 'bg-ink text-paper' : 'text-muted hover:text-ink',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/** A dot plus a name, wherever a day or a cost is attributed to a home. */
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
    neutral: 'border-line text-muted',
    a: 'border-home-a text-home-a',
    b: 'border-home-b text-home-b',
    warn: 'border-warn text-warn',
  }
  return (
    <span className={cx('rounded-full border px-2 py-0.5 text-xs font-medium', tones[tone])}>
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
    <div className="border-y border-line py-10 text-center">
      <p className="font-display text-lg">{title}</p>
      <p className="mx-auto mt-1 max-w-[32ch] text-sm text-muted">{body}</p>
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
        className="absolute inset-0 bg-black/50"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-sheet relative flex max-h-[88vh] w-full flex-col rounded-t-sheet border border-line bg-surface sm:max-w-lg sm:rounded-sheet"
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 rounded-md px-2 py-1 text-muted hover:text-ink"
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
