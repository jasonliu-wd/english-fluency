import { useState } from 'react'
import { ALL_CLIPS, PACE_META, type Clip, type ClipPace } from '@/data/clips'
import ListeningPlayer from './ListeningPlayer'

const FILTERS: { key: ClipPace | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'clear', label: 'Clear' },
  { key: 'native', label: 'Natural' },
  { key: 'fast', label: 'Fast / Native' },
]

const PACE_DOT: Record<ClipPace, string> = {
  clear: 'bg-emerald-500',
  native: 'bg-amber-500',
  fast: 'bg-accent',
}

export default function ListeningPage() {
  const [selected, setSelected] = useState<Clip | null>(null)
  const [filter, setFilter] = useState<ClipPace | 'all'>('all')

  if (selected) {
    return <ListeningPlayer clip={selected} onBack={() => setSelected(null)} />
  }

  const clips = filter === 'all' ? ALL_CLIPS : ALL_CLIPS.filter((c) => c.pace === filter)

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Step 1 · Listening</p>
        <h1 className="font-display text-2xl font-semibold text-ink mt-1">Train your ear</h1>
        <p className="text-sm text-ink/60 mt-1.5 leading-relaxed">
          Real, natural English — the way people actually speak. Listen first, then reveal the script.
        </p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`shrink-0 text-xs font-medium px-3.5 py-1.5 rounded-full border transition-colors ${
              filter === key
                ? 'bg-ink text-paper border-ink'
                : 'bg-card text-ink/60 border-ink/15 hover:border-accent/40'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {clips.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 bg-card text-center py-12 px-4">
          <p className="text-sm text-ink/50">No clips at this level yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {clips.map((clip) => {
            const pace = PACE_META[clip.pace]
            return (
              <li key={clip.id}>
                <button
                  onClick={() => setSelected(clip)}
                  className="card w-full text-left hover:border-accent/40 hover:-translate-y-0.5 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 mt-0.5 grid place-items-center w-10 h-10 rounded-xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-paper transition-colors">
                      ▶
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-semibold text-ink leading-snug">{clip.title}</p>
                      <p className="text-xs text-ink/50 mt-0.5">{clip.source} · {clip.accent}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${PACE_DOT[clip.pace]}`} />
                        <span className="text-xs text-ink/60">{pace.label}</span>
                        <span className="text-ink/20">·</span>
                        <span className="text-xs text-ink/40">{clip.transcript.length} lines</span>
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
