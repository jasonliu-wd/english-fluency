import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { DEV_USER_ID } from '@/lib/constants'
import { fetchTodayProgress, markActivity, type ActivityKey } from './progressService'

interface Props {
  activity: ActivityKey
}

export default function MarkCompleteButton({ activity }: Props) {
  const { user } = useAuthStore()
  const userId = user?.id ?? DEV_USER_ID
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTodayProgress(userId).then((p) => {
      setDone(p ? p[activity] : false)
      setLoading(false)
    })
  }, [userId, activity])

  async function handleClick() {
    const newVal = !done
    setDone(newVal)
    await markActivity(userId, activity, newVal)
  }

  if (loading) return null

  return (
    <button
      onClick={handleClick}
      className={`w-full py-3 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
        done
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
      }`}
    >
      {done ? (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
            <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Completed today ✓
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" />
          </svg>
          Mark complete for today
        </>
      )}
    </button>
  )
}
