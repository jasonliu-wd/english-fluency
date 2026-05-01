import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { DEV_USER_ID } from '@/lib/constants'
import { fetchTodayProgress, countCompleted } from './progressService'

export default function ReminderBanner() {
  const { user } = useAuthStore()
  const userId = user?.id ?? DEV_USER_ID
  const [show, setShow] = useState(false)

  useEffect(() => {
    const dismissed = sessionStorage.getItem('reminder-dismissed')
    if (dismissed) return

    const hour = new Date().getHours()
    // Only show reminder after 6 PM if not all done
    if (hour < 18) return

    fetchTodayProgress(userId).then((p) => {
      if (!p || countCompleted(p) < 5) setShow(true)
    })
  }, [userId])

  if (!show) return null

  return (
    <div className="mx-4 mt-2 rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-2.5 flex items-center gap-3 text-sm">
      <span className="text-lg">⏰</span>
      <span className="flex-1 text-indigo-800">Don't forget today's practice!</span>
      <Link
        to="/progress"
        onClick={() => setShow(false)}
        className="text-indigo-600 font-medium whitespace-nowrap hover:text-indigo-800"
      >
        View →
      </Link>
      <button
        onClick={() => { sessionStorage.setItem('reminder-dismissed', '1'); setShow(false) }}
        className="text-indigo-400 hover:text-indigo-600 text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
