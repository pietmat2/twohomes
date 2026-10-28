import { useEffect } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { cx } from './components/ui'
import { useI18n } from './lib/i18n'
import { useApp } from './lib/store'
import type { MessageKey } from './lib/messages/en'
import Today from './pages/Today'
import CalendarPage from './pages/Calendar'
import Expenses from './pages/Expenses'
import Moments from './pages/Moments'
import Kids from './pages/Kids'
import Settings from './pages/Settings'
import Guide from './pages/Guide'
import Join from './pages/Join'

const NAV: { to: string; label: MessageKey }[] = [
  { to: '/today', label: 'nav.today' },
  { to: '/calendar', label: 'nav.calendar' },
  { to: '/money', label: 'nav.money' },
  { to: '/moments', label: 'nav.moments' },
  { to: '/kids', label: 'nav.kids' },
]

/**
 * A floating pill, words only: five places, one of them lit. The labels are
 * short enough in all three languages to sit side by side at 320px.
 */
function BottomNav() {
  const { t } = useI18n()
  return (
    <nav
      aria-label={t('nav.main')}
      className="fixed inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-30 px-3 min-[360px]:px-5"
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-between rounded-full bg-nav px-1.5 shadow-[0_0_0_1px_var(--color-line)] min-[360px]:px-2">
        {/* Only the lit item needs room for its pill. At 320px "Kalendarz" and
            "Pieniądze" fit only if the others give up their padding. */}
        {NAV.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cx(
                'rounded-full py-2.5 text-micro font-bold whitespace-nowrap transition-colors min-[360px]:text-xs',
                isActive
                  ? 'bg-nav-on px-2.5 text-nav-on-text'
                  : 'px-1 text-nav-text hover:text-nav-on min-[360px]:px-2',
              )
            }
          >
            {t(label)}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default function App() {
  const { saveError } = useApp()
  const { t } = useI18n()
  const { pathname } = useLocation()

  // Money paints the whole screen, overscroll included.
  useEffect(() => {
    const root = document.documentElement
    if (pathname.startsWith('/money')) root.dataset.screen = 'money'
    else delete root.dataset.screen
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-dvh">
      {saveError ? (
        <p className="mx-auto max-w-lg px-5 pt-4 text-sm font-bold text-danger">
          {t(saveError === 'quota' ? 'common.saveFailedQuota' : 'common.saveFailed')}
        </p>
      ) : null}
      {/* The hug mark is wider than a phone; clip it rather than scroll sideways. */}
      <main className="relative mx-auto max-w-lg overflow-x-clip px-5 pt-[max(1.75rem,calc(env(safe-area-inset-top)+1rem))] pb-36">
        <Routes>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<Today />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/money" element={<Expenses />} />
          <Route path="/moments" element={<Moments />} />
          <Route path="/kids" element={<Kids />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/join/:code" element={<Join />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
