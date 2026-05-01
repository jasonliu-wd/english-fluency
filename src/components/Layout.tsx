import { NavLink, Outlet } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import ReminderBanner from '@/features/progress/ReminderBanner'

const nav = [
  { to: '/', label: '🏠', title: 'Home' },
  { to: '/vocab', label: '🃏', title: 'Vocab' },
  { to: '/writing', label: '✍️', title: 'Writing' },
  { to: '/shadow', label: '📖', title: 'Shadow' },
  { to: '/drill', label: '💭', title: 'Drill' },
  { to: '/speaking', label: '🎙️', title: 'Speaking' },
  { to: '/progress', label: '📊', title: 'Progress' },
]

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto">
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
        <span className="font-bold text-indigo-600 text-lg">EnFluency</span>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Sign out
        </button>
      </header>

      <ReminderBanner />

      <main className="flex-1 overflow-y-auto pb-safe px-4 pt-4">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around pt-2 pb-nav max-w-2xl mx-auto">
        {nav.map(({ to, label, title }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center text-xs gap-0.5 px-2 py-1 rounded-lg transition-colors ${
                isActive ? 'text-indigo-600' : 'text-gray-400'
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
