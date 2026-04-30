import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import plan from '@/data/vocab-plans/30-day-plan.json'

type Props = { onAdded: () => void }

export default function DayPlanTab({ onAdded }: Props) {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState<number | null>(null)
  const [done, setDone] = useState<Set<number>>(new Set())
  const [error, setError] = useState('')

  async function addWeek(weekIndex: number) {
    setLoading(weekIndex)
    setError('')
    const week = plan.weeks[weekIndex]
    const today = new Date().toISOString().split('T')[0]

    const rows = week.words.map((w) => ({
      user_id: user?.id ?? '',
      word: w.word,
      meaning_zh: w.meaning_zh,
      example: w.example,
      next_review: today,
      interval: 1,
      ease_factor: 2.5,
      repetitions: 0,
    }))

    // upsert so duplicate words don't error — ignored if already exists
    const { error } = await supabase
      .from('vocab_cards')
      .upsert(rows, { onConflict: 'user_id,word', ignoreDuplicates: true })

    if (error) {
      setError(error.message)
    } else {
      setDone((prev) => new Set([...prev, weekIndex]))
      onAdded()
    }
    setLoading(null)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Add a week's words to your flashcard deck. They'll appear in your daily review queue immediately.
      </p>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {plan.weeks.map((week, i) => (
        <div key={i} className="card space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-900">Week {week.week}</p>
              <p className="text-sm text-indigo-600">{week.theme}</p>
            </div>
            <button
              onClick={() => addWeek(i)}
              disabled={loading === i || done.has(i)}
              className={`shrink-0 text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                done.has(i)
                  ? 'border-green-300 text-green-600 bg-green-50'
                  : 'border-indigo-300 text-indigo-600 hover:bg-indigo-50 disabled:opacity-50'
              }`}
            >
              {loading === i ? 'Adding…' : done.has(i) ? '✓ Added' : 'Add all'}
            </button>
          </div>

          <ul className="space-y-1">
            {week.words.map((w) => (
              <li key={w.word} className="flex items-baseline gap-2 text-sm">
                <span className="font-medium text-gray-900 min-w-32">{w.word}</span>
                <span className="text-gray-400">{w.meaning_zh}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
