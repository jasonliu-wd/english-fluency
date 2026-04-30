import { useState } from 'react'
import type { Rating } from '@/lib/srs'

type VocabCard = {
  id: string
  word: string
  meaning_zh: string
  example: string | null
  interval: number
  repetitions: number
}

type Props = {
  card: VocabCard
  remaining: number
  onRate: (id: string, rating: Rating) => void
}

const RATINGS: { label: string; rating: Rating; color: string; next: string }[] = [
  { label: 'Again', rating: 0, color: 'border-red-300 text-red-600 hover:bg-red-50', next: '<1d' },
  { label: 'Hard', rating: 1, color: 'border-orange-300 text-orange-600 hover:bg-orange-50', next: '~1d' },
  { label: 'Good', rating: 2, color: 'border-blue-300 text-blue-600 hover:bg-blue-50', next: '~3d' },
  { label: 'Easy', rating: 3, color: 'border-green-300 text-green-600 hover:bg-green-50', next: '~7d' },
]

export default function ReviewCard({ card, remaining, onRate }: Props) {
  const [flipped, setFlipped] = useState(false)

  function handleRate(rating: Rating) {
    setFlipped(false)
    onRate(card.id, rating)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>{remaining} card{remaining !== 1 ? 's' : ''} remaining</span>
        <span>tap card to reveal</span>
      </div>

      {/* Card */}
      <button
        onClick={() => setFlipped(true)}
        className="card w-full min-h-52 flex flex-col items-center justify-center gap-4 cursor-pointer hover:shadow-md transition-shadow text-center"
      >
        <p className="text-3xl font-bold text-gray-900">{card.word}</p>

        {flipped ? (
          <div className="space-y-2 animate-fade-in">
            <p className="text-xl text-indigo-700 font-medium">{card.meaning_zh}</p>
            {card.example && (
              <p className="text-sm text-gray-500 italic max-w-xs">"{card.example}"</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-300">Tap to see meaning</p>
        )}
      </button>

      {/* Rating buttons — only shown after flip */}
      {flipped && (
        <div className="grid grid-cols-4 gap-2">
          {RATINGS.map(({ label, rating, color, next }) => (
            <button
              key={label}
              onClick={() => handleRate(rating)}
              className={`border rounded-lg py-2 px-1 text-xs font-medium transition-colors ${color}`}
            >
              <div>{label}</div>
              <div className="text-gray-400 font-normal mt-0.5">{next}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
