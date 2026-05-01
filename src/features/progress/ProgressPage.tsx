import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { DEV_USER_ID } from '@/lib/constants'
import {
  fetchLast30Days,
  fetchTodayProgress,
  markActivity,
  countCompleted,
  todayISO,
  type ActivityKey,
  type DailyProgress,
} from './progressService'

const activities: { key: ActivityKey; icon: string; label: string }[] = [
  { key: 'vocab', icon: '🃏', label: 'Flashcards' },
  { key: 'writing', icon: '✍️', label: 'Writing Lab' },
  { key: 'shadowing', icon: '📖', label: 'Shadow Reading' },
  { key: 'thinking', icon: '💭', label: 'Think in English' },
  { key: 'speaking', icon: '🎙️', label: 'Speaking Practice' },
]

const empty: DailyProgress = {
  date: '',
  vocab: false,
  writing: false,
  shadowing: false,
  thinking: false,
  speaking: false,
}

function cellColor(pct: number): string {
  if (pct === 0) return 'bg-gray-100'
  if (pct < 0.4) return 'bg-yellow-200'
  if (pct < 0.8) return 'bg-green-300'
  return 'bg-green-500'
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ProgressPage() {
  const { user } = useAuthStore()
  const userId = user?.id ?? DEV_USER_ID
  const [history, setHistory] = useState<DailyProgress[]>([])
  const [today, setToday] = useState<DailyProgress>(empty)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchLast30Days(userId), fetchTodayProgress(userId)]).then(([hist, tod]) => {
      setHistory(hist)
      setToday(tod ?? empty)
      setLoading(false)
    })
  }, [userId])

  async function toggle(key: ActivityKey) {
    const newVal = !today[key]
    setToday((prev) => ({ ...prev, [key]: newVal }))
    const updated = await markActivity(userId, key, newVal)
    if (updated) {
      setToday(updated)
      setHistory((prev) => {
        const idx = prev.findIndex((p) => p.date === updated.date)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = updated
          return next
        }
        return [...prev, updated]
      })
    }
  }

  // Build a 30-day grid (day 0 = 30 days ago, day 29 = today)
  const grid: { date: string; pct: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().split('T')[0]
    const row = history.find((p) => p.date === iso)
    grid.push({ date: iso, pct: row ? countCompleted(row) / 5 : 0 })
  }

  const streakDays = (() => {
    let count = 0
    for (let i = grid.length - 1; i >= 0; i--) {
      if (grid[i].pct === 1) count++
      else break
    }
    return count
  })()

  const todayCompleted = countCompleted(today)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Progress</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track your 30-day practice streak</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-3">
          <div className="text-2xl font-bold text-indigo-600">{streakDays}</div>
          <div className="text-xs text-gray-500 mt-0.5">day streak 🔥</div>
        </div>
        <div className="card text-center py-3">
          <div className="text-2xl font-bold text-green-600">
            {history.filter((p) => countCompleted(p) === 5).length}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">perfect days ✨</div>
        </div>
        <div className="card text-center py-3">
          <div className="text-2xl font-bold text-yellow-600">{todayCompleted}</div>
          <div className="text-xs text-gray-500 mt-0.5">done today</div>
        </div>
      </div>

      {/* 30-day heatmap */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3">Last 30 Days</h2>
        <div className="grid grid-cols-10 gap-1.5">
          {grid.map(({ date, pct }) => (
            <div
              key={date}
              title={`${formatDate(date)} — ${Math.round(pct * 5)}/5`}
              className={`aspect-square rounded-sm ${cellColor(pct)} ${date === todayISO() ? 'ring-2 ring-indigo-400' : ''}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
          <div className="w-3 h-3 rounded-sm bg-gray-100" /> None
          <div className="w-3 h-3 rounded-sm bg-yellow-200" /> Partial
          <div className="w-3 h-3 rounded-sm bg-green-300" /> Most
          <div className="w-3 h-3 rounded-sm bg-green-500" /> All 5
        </div>
      </div>

      {/* Today's checklist */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Today's Activities</h2>
          <span className="text-xs text-gray-400">{todayCompleted} / 5</span>
        </div>

        {todayCompleted === 5 && (
          <div className="mb-3 rounded-lg bg-green-50 border border-green-100 text-center py-2 text-sm text-green-700 font-medium">
            🎉 All done for today!
          </div>
        )}

        {loading ? (
          <div className="text-center py-4 text-gray-400 text-sm">Loading…</div>
        ) : (
          <ul className="space-y-2">
            {activities.map(({ key, icon, label }) => {
              const done = today[key]
              return (
                <li key={key} className="flex items-center gap-3">
                  <button
                    onClick={() => toggle(key)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      done
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-indigo-400'
                    }`}
                    aria-label={`Toggle ${label}`}
                  >
                    {done && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  <span className="text-base">{icon}</span>
                  <span className={`text-sm ${done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {label}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
