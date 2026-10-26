import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import {
  IconCalendar,
  IconHome,
  IconKids,
  IconMoments,
  IconMoney,
  IconSettings,
} from './components/icons'
import { cx } from './components/ui'
import { useApp } from './lib/store'
import Today from './pages/Today'
import CalendarPage from './pages/Calendar'
import Expenses from './pages/Expenses'
import Moments from './pages/Moments'
import Kids from './pages/Kids'
import Settings from './pages/Settings'

const NAV = [
  { to: '/today', label: 'Today', Icon: IconHome },
  { to: '/calendar', label: 'Calendar', Icon: IconCalendar },
  { to: '/money', label: 'Money', Icon: IconMoney },
  { to: '/moments', label: 'Moments', Icon: IconMoments },
  { to: '/kids', label: 'Kids', Icon: IconKids },
]

function TopBar() {
  const { state } = useApp()
  const { pathname } = useLocation()
  const current = NAV.find((item) => pathname.startsWith(item.to))

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <div className="flex items-baseline gap-2">
          <span className="text-[0.9375rem] font-semibold tracking-tight">Twohomes</span>
          {current ? <span className="text-sm text-muted">{current.label}</span> : null}
        </div>
        <div className="flex items-center gap-1">
          <span className="hidden text-xs text-muted sm:inline">
            Signed in as {state.parents[state.me].name}
          </span>
          <NavLink
            to="/settings"
            aria-label="Settings"
            className={({ isActive }) =>
              cx(
                'rounded-lg p-2 transition',
                isActive ? 'bg-sunken text-ink' : 'text-muted hover:bg-sunken hover:text-ink',
              )
            }
          >
            <IconSettings />
          </NavLink>
        </div>
      </div>
    </header>
  )
}

function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-md">
      <div className="mx-auto grid max-w-3xl grid-cols-5 px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {NAV.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cx(
                'flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[0.6875rem] font-medium transition',
                isActive ? 'text-ink' : 'text-faint hover:text-muted',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon width={21} height={21} strokeWidth={isActive ? 2 : 1.6} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default function App() {
  const { saveError } = useApp()

  return (
    <div className="min-h-dvh">
      <TopBar />
      {saveError ? (
        <p className="mx-auto max-w-3xl px-4 pt-3 text-sm text-danger">{saveError}</p>
      ) : null}
      <main className="mx-auto max-w-3xl px-4 pt-4 pb-28">
        <Routes>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<Today />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/money" element={<Expenses />} />
          <Route path="/moments" element={<Moments />} />
          <Route path="/kids" element={<Kids />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
