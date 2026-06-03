import { Link } from 'react-router-dom'
import DailyChecklist from '@/features/progress/DailyChecklist'

const extras = [
  { to: '/speaking', icon: '🎙️', title: 'Speaking Practice', desc: 'Read aloud & pronounce' },
  { to: '/phrases', icon: '📌', title: 'Phrase Bank', desc: 'Lines you saved to keep' },
]

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-ink/45">{today}</p>
        <h1 className="font-display text-3xl font-semibold text-ink mt-1">{greeting()}.</h1>
        <p className="text-sm text-ink/55 mt-1.5 leading-relaxed">
          Five small steps, every day. That's how fluency is built.
        </p>
      </header>

      <DailyChecklist />

      <section>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink/40 mb-2.5">Also available</p>
        <div className="grid grid-cols-2 gap-3">
          {extras.map(({ to, icon, title, desc }) => (
            <Link key={to} to={to} className="card block hover:border-accent/40 hover:-translate-y-0.5 transition-all">
              <div className="text-2xl mb-2">{icon}</div>
              <div className="font-display font-semibold text-ink leading-snug">{title}</div>
              <div className="text-xs text-ink/50 mt-0.5 leading-snug">{desc}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
