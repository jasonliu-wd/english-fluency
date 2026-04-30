import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { reviewCard, isDue, type Rating } from '@/lib/srs'
import ReviewCard from './ReviewCard'
import AddCardForm from './AddCardForm'
import DayPlanTab from './DayPlanTab'

type VocabCard = {
  id: string
  word: string
  meaning_zh: string
  example: string | null
  next_review: string
  interval: number
  ease_factor: number
  repetitions: number
}

type Tab = 'review' | 'add' | 'plan' | 'all'

export default function VocabPage() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<Tab>('review')
  const [cards, setCards] = useState<VocabCard[]>([])
  const [dueCards, setDueCards] = useState<VocabCard[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCards = useCallback(async () => {
    const { data } = await supabase
      .from('vocab_cards')
      .select('*')
      .eq('user_id', user?.id ?? '')
      .order('created_at', { ascending: false })
    if (data) {
      setCards(data)
      setDueCards(data.filter(isDue))
    }
    setLoading(false)
  }, [user])

  useEffect(() => { fetchCards() }, [fetchCards])

  async function handleRate(id: string, rating: Rating) {
    const card = cards.find((c) => c.id === id)
    if (!card) return

    const updates = reviewCard(card, rating)
    await supabase.from('vocab_cards').update(updates).eq('id', id)

    // remove from due queue, refresh all cards list
    setDueCards((prev) => prev.filter((c) => c.id !== id))
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  }

  async function handleDelete(id: string) {
    await supabase.from('vocab_cards').delete().eq('id', id)
    setCards((prev) => prev.filter((c) => c.id !== id))
    setDueCards((prev) => prev.filter((c) => c.id !== id))
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'review', label: `Review${dueCards.length ? ` (${dueCards.length})` : ''}` },
    { key: 'add', label: 'Add' },
    { key: 'plan', label: '30-Day Plan' },
    { key: 'all', label: `All (${cards.length})` },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">🃏 Flashcards</h1>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
              tab === key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Review tab */}
      {tab === 'review' && (
        loading ? (
          <div className="text-center py-16 text-gray-400">Loading…</div>
        ) : dueCards.length === 0 ? (
          <div className="card text-center py-14">
            <p className="text-4xl mb-3">🎉</p>
            <p className="font-semibold text-gray-900">All caught up!</p>
            <p className="text-sm text-gray-400 mt-1">No cards due today. Come back tomorrow.</p>
            <button onClick={() => setTab('add')} className="btn-primary mt-4 text-sm">
              Add new cards
            </button>
          </div>
        ) : (
          <ReviewCard
            card={dueCards[0]}
            remaining={dueCards.length}
            onRate={handleRate}
          />
        )
      )}

      {/* Add tab */}
      {tab === 'add' && (
        <div className="card">
          <AddCardForm onAdded={fetchCards} />
        </div>
      )}

      {/* 30-day plan tab */}
      {tab === 'plan' && <DayPlanTab onAdded={fetchCards} />}

      {/* All cards tab */}
      {tab === 'all' && (
        loading ? (
          <div className="text-center py-16 text-gray-400">Loading…</div>
        ) : cards.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            <p>No cards yet.</p>
            <button onClick={() => setTab('add')} className="btn-primary mt-4 text-sm">
              Add your first card
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {cards.map((card) => (
              <div key={card.id} className="card flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{card.word}</p>
                  <p className="text-sm text-indigo-600">{card.meaning_zh}</p>
                  {card.example && (
                    <p className="text-xs text-gray-400 mt-0.5 italic truncate">"{card.example}"</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-gray-400">next</p>
                  <p className={`text-xs font-medium ${isDue(card) ? 'text-orange-500' : 'text-gray-500'}`}>
                    {isDue(card) ? 'due now' : card.next_review}
                  </p>
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="text-xs text-red-400 hover:text-red-600 mt-1"
                  >
                    delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
