import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { useI18n } from '../lib/i18n'
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
 * A group of related content. There are no cards in this app: a rule marks
 * where one thing ends and the next begins, and space does the rest.
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
  return <Tag className={cx('border-t border-line pt-5', className)}>{children}</Tag>
}

/** A list whose items are separated by hairlines rather than boxed one by one. */
export function Rows({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cx('divide-y divide-line border-y border-line', className)}>{children}</ul>
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
  const content = <div className={cx('flex items-start gap-4 py-4', className)}>{children}</div>
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
    <div className="mb-4 flex items-baseline justify-between gap-4">
      <h2 className="wide text-xl font-semibold">{children}</h2>
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
    'inline-flex items-center justify-center gap-2 rounded-card font-medium transition-colors disabled:pointer-events-none disabled:opacity-40'
  const sizes = { sm: 'px-4 py-2 text-sm', md: 'px-5 py-3 text-base' }
  const variants = {
    primary: 'bg-ink text-paper hover:opacity-85',
    secondary: 'border border-line hover:bg-sunken',
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
      <span className="mb-1 block text-sm text-muted">{label}</span>
      {children}
      {hint ? <span className="mt-2 block text-sm text-faint">{hint}</span> : null}
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
    <div className="flex gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cx(
            'flex-1 rounded-card border px-3 py-2 text-sm transition-colors',
            value === option.value
              ? 'border-ink bg-ink text-paper'
              : 'border-line text-muted hover:text-ink',
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
    <span className={cx('inline-flex items-center gap-2 text-sm', className)}>
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
    <span className={cx('rounded-card border px-2 py-0.5 text-xs', tones[tone])}>{children}</span>
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
    <div className="border-t border-line py-14">
      <p className="wide text-xl font-semibold">{title}</p>
      <p className="mt-2 max-w-[40ch] text-base text-muted">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
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
        className="absolute inset-0 bg-ink/35"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-sheet relative flex max-h-[88vh] w-full flex-col rounded-t-sheet border border-line bg-paper sm:max-w-lg sm:rounded-sheet"
      >
        <header className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="wide text-xl font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 px-2 py-1 text-sm text-muted hover:text-ink"
          >
            {t('common.close')}
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer ? <div className="border-t border-line px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  )
}
