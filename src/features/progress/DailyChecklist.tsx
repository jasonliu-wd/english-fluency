import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { DEV_USER_ID } from '@/lib/constants'
import { RITUAL_ACTIVITIES } from './activities'
import {
  fetchTodayProgress,
  fetchLast30Days,
  markActivity,
  countCompleted,
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

function computeStreak(history: DailyProgress[]): number {
  const byDate = new Map(history.map((p) => [p.date, p]))
  let count = 0
  const d = new Date()
  // If today isn't complete yet, start the count from yesterday.
  const todayIso = d.toISOString().split('T')[0]
  const todayRow = byDate.get(todayIso)
  if (!todayRow || countCompleted(todayRow) < 5) d.setDate(d.getDate() - 1)
  for (;;) {
    const iso = d.toISOString().split('T')[0]
    const row = byDate.get(iso)
    if (row && countCompleted(row) === 5) {
      count++
      d.setDate(d.getDate() - 1)
    } else break
  }
  return count
}

export default function DailyChecklist() {
  const { user } = useAuthStore()
  const userId = user?.id ?? DEV_USER_ID
  const [progress, setProgress] = useState<DailyProgress>(empty)
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchTodayProgress(userId), fetchLast30Days(userId)]).then(([today, hist]) => {
      setProgress(today ?? empty)
      setStreak(computeStreak(hist))
      setLoading(false)
    })
  }, [userId])

  async function toggle(key: ActivityKey) {
    const newVal = !progress[key]
    setProgress((prev) => ({ ...prev, [key]: newVal }))
    const updated = await markActivity(userId, key, newVal)
    if (updated) {
      setProgress(updated)
      const hist = await fetchLast30Days(userId)
      setStreak(computeStreak(hist))
    }
  }

  const completed = countCompleted(progress)
  const allDone = completed === 5

  return (
    <section className="card">
      <div className="flex items-end justify-between mb-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Today's Path</p>
          <h2 className="font-display text-xl font-semibold text-ink mt-0.5">
            {allDone ? 'All five, done.' : `${completed} of 5 steps`}
          </h2>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-semibold text-ink leading-none">{streak}</div>
          <div className="text-[11px] text-ink/45 mt-1">day streak</div>
        </div>
      </div>

      <ol className="relative">
        {RITUAL_ACTIVITIES.map((a, i) => {
          const done = progress[a.key]
          const isLast = i === RITUAL_ACTIVITIES.length - 1
          return (
            <li key={a.key} className="relative flex gap-4 pb-5 last:pb-0">
              {/* connector line */}
              {!isLast && (
                <span
                  className={`absolute left-[18px] top-9 bottom-0 w-px ${done ? 'bg-accent/40' : 'bg-ink/10'}`}
                  aria-hidden
                />
              )}

              {/* node / toggle */}
              <button
                onClick={() => toggle(a.key)}
                disabled={loading}
                aria-label={`Mark ${a.label} ${done ? 'not done' : 'done'}`}
                className={`relative z-10 shrink-0 w-9 h-9 rounded-full grid place-items-center border-2 transition-all ${
                  done
                    ? 'bg-accent border-accent text-paper'
                    : 'bg-card border-ink/20 text-ink/30 hover:border-accent/50'
                }`}
              >
                {done ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                    <path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span className="text-sm font-semibold">{a.step}</span>
                )}
              </button>

              {/* label */}
              <Link to={a.to} className="flex-1 min-w-0 pt-0.5 group">
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{a.icon}</span>
                  <span
                    className={`font-medium ${
                      done ? 'text-ink/40 line-through' : 'text-ink group-hover:text-accent'
                    }`}
                  >
                    {a.label}
                  </span>
                </div>
                <p className="text-xs text-ink/45 mt-0.5">{a.desc}</p>
              </Link>
            </li>
          )
        })}
      </ol>

      <Link
        to="/progress"
        className="mt-4 block text-center text-xs text-ink/45 hover:text-accent transition-colors"
      >
        View 30-day history →
      </Link>
    </section>
  )
}
