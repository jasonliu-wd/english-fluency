import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { DEV_USER_ID } from '@/lib/constants'
import {
  fetchTodayProgress,
  markActivity,
  countCompleted,
  type ActivityKey,
  type DailyProgress,
} from './progressService'

const activities: { key: ActivityKey; icon: string; label: string; to: string }[] = [
  { key: 'vocab', icon: '🃏', label: 'Flashcards', to: '/vocab' },
  { key: 'writing', icon: '✍️', label: 'Writing Lab', to: '/writing' },
  { key: 'shadowing', icon: '📖', label: 'Shadow Reading', to: '/shadow' },
  { key: 'thinking', icon: '💭', label: 'Think in English', to: '/drill' },
  { key: 'speaking', icon: '🎙️', label: 'Speaking Practice', to: '/speaking' },
]

const empty: DailyProgress = {
  date: '',
  vocab: false,
  writing: false,
  shadowing: false,
  thinking: false,
  speaking: false,
}

export default function DailyChecklist() {
  const { user } = useAuthStore()
  const userId = user?.id ?? DEV_USER_ID
  const [progress, setProgress] = useState<DailyProgress>(empty)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTodayProgress(userId).then((p) => {
      setProgress(p ?? empty)
      setLoading(false)
    })
  }, [userId])

  async function toggle(key: ActivityKey) {
    const newVal = !progress[key]
    setProgress((prev) => ({ ...prev, [key]: newVal }))
    const updated = await markActivity(userId, key, newVal)
    if (updated) setProgress(updated)
  }

  const completed = countCompleted(progress)
  const allDone = completed === 5

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-semibold text-gray-900">Today's Practice</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {allDone ? '🎉 All done for today!' : `${completed} / 5 completed`}
          </p>
        </div>
        <Link to="/progress" className="text-xs text-indigo-500 hover:text-indigo-700">
          30-day history →
        </Link>
      </div>

      {allDone && (
        <div className="mb-3 rounded-lg bg-green-50 border border-green-100 text-center py-2 text-sm text-green-700 font-medium animate-pulse">
          ✨ Perfect day! Keep the streak going!
        </div>
      )}

      <ul className="space-y-2">
        {activities.map(({ key, icon, label, to }) => {
          const done = progress[key]
          return (
            <li key={key} className="flex items-center gap-3">
              <button
                onClick={() => toggle(key)}
                disabled={loading}
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
              <Link
                to={to}
                className={`text-sm flex-1 ${done ? 'line-through text-gray-400' : 'text-gray-700 hover:text-indigo-600'}`}
              >
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
