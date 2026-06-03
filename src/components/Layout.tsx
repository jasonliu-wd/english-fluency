import { NavLink, Outlet } from 'react-router-dom'
import ReminderBanner from '@/features/progress/ReminderBanner'

const nav = [
  { to: '/', label: '🏠', title: 'Home' },
  { to: '/listening', label: '🎧', title: 'Listen' },
  { to: '/drill', label: '💭', title: 'Think' },
  { to: '/vocab', label: '🃏', title: 'Review' },
  { to: '/shadow', label: '🎬', title: 'Shadow' },
  { to: '/writing', label: '✍️', title: 'Write' },
]

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto bg-paper">
      <header className="flex items-center justify-between px-4 py-3.5 bg-paper/85 backdrop-blur border-b border-ink/[0.07] sticky top-0 z-10">
        <span className="font-display font-semibold text-ink text-lg tracking-tight">
          Fluent<span className="text-accent">.</span>
        </span>
        <span className="text-xs text-ink/40">daily ritual</span>
      </header>

      <ReminderBanner />

      <main className="flex-1 overflow-y-auto pb-safe px-4 pt-5">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-ink/[0.07] flex justify-around pt-2 pb-nav max-w-2xl mx-auto">
        {nav.map(({ to, label, title }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center text-[11px] gap-0.5 px-2 py-1 rounded-lg transition-colors ${
                isActive ? 'text-accent font-medium' : 'text-ink/40 hover:text-ink/70'
              }`
            }
          >
            <span className="text-xl">{label}</span>
            <span>{title}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
