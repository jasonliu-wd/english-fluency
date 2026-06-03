import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { DEV_USER_ID } from '@/lib/constants'
import { RITUAL_ACTIVITIES } from './activities'
import {
  fetchLast30Days,
  fetchTodayProgress,
  markActivity,
  countCompleted,
  todayISO,
  type ActivityKey,
  type DailyProgress,
} from './progressService'

const empty: DailyProgress = {
  date: '',
  listening: false,
  vocab: false,
  writing: false,
  shadowing: false,
  thinking: false,
  speaking: false,
}

function cellColor(pct: number): string {
  if (pct === 0) return 'bg-ink/[0.06]'
  if (pct < 0.4) return 'bg-accent/25'
  if (pct < 0.8) return 'bg-accent/55'
  return 'bg-accent'
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
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Progress</p>
        <h1 className="font-display text-2xl font-semibold text-ink mt-1">Your last 30 days</h1>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-4">
          <div className="font-display text-3xl font-semibold text-accent">{streakDays}</div>
          <div className="text-xs text-ink/50 mt-1">day streak</div>
        </div>
        <div className="card text-center py-4">
          <div className="font-display text-3xl font-semibold text-ink">
            {history.filter((p) => countCompleted(p) === 5).length}
          </div>
          <div className="text-xs text-ink/50 mt-1">perfect days</div>
        </div>
        <div className="card text-center py-4">
          <div className="font-display text-3xl font-semibold text-ink">{todayCompleted}</div>
          <div className="text-xs text-ink/50 mt-1">done today</div>
        </div>
      </div>

      {/* 30-day heatmap */}
      <div className="card">
        <h2 className="font-display font-semibold text-ink mb-3">Daily completion</h2>
        <div className="grid grid-cols-10 gap-1.5">
          {grid.map(({ date, pct }) => (
            <div
              key={date}
              title={`${formatDate(date)} — ${Math.round(pct * 5)}/5`}
              className={`aspect-square rounded ${cellColor(pct)} ${date === todayISO() ? 'ring-2 ring-accent ring-offset-1 ring-offset-card' : ''}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-ink/40">
          <div className="w-3 h-3 rounded bg-ink/[0.06]" /> None
          <div className="w-3 h-3 rounded bg-accent/25" /> Some
          <div className="w-3 h-3 rounded bg-accent/55" /> Most
          <div className="w-3 h-3 rounded bg-accent" /> All 5
        </div>
      </div>

      {/* Today's checklist */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-ink">Today</h2>
          <span className="text-xs text-ink/40">{todayCompleted} / 5</span>
        </div>

        {loading ? (
          <div className="text-center py-4 text-ink/40 text-sm">Loading…</div>
        ) : (
          <ul className="space-y-2.5">
            {RITUAL_ACTIVITIES.map(({ key, icon, label }) => {
              const done = today[key]
              return (
                <li key={key} className="flex items-center gap-3">
                  <button
                    onClick={() => toggle(key)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      done
                        ? 'bg-accent border-accent text-paper'
                        : 'border-ink/20 hover:border-accent/50'
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
                  <span className={`text-sm ${done ? 'line-through text-ink/40' : 'text-ink/80'}`}>
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
