import { useAuthStore } from '@/store/authStore'
import { Link } from 'react-router-dom'

const features = [
  { to: '/vocab', icon: '🃏', title: 'Flashcards', desc: 'Review due cards with spaced repetition' },
  { to: '/writing', icon: '✍️', title: 'Writing Lab', desc: 'Compare your draft vs polished writing' },
  { to: '/shadow', icon: '📖', title: 'Shadow Reading', desc: 'Read along with TV shows & TED talks' },
  { to: '/drill', icon: '💭', title: 'Think in English', desc: 'Daily prompts to think & speak freely' },
  { to: '/speaking', icon: '🎙️', title: 'Speaking Practice', desc: 'Read aloud, shadow, and pronounce' },
  { to: '/phrases', icon: '📌', title: 'Phrase Bank', desc: 'Save natural phrases you want to remember' },
]

export default function Dashboard() {
  const { user } = useAuthStore()
  const email = user?.email ?? ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Good day! 👋</h1>
        <p className="text-sm text-gray-500 mt-0.5">{email}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {features.map(({ to, icon, title, desc }) => (
          <Link key={to} to={to} className="card hover:shadow-md transition-shadow block">
            <div className="text-2xl mb-2">{icon}</div>
            <div className="font-semibold text-sm text-gray-900">{title}</div>
            <div className="text-xs text-gray-500 mt-0.5 leading-snug">{desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
