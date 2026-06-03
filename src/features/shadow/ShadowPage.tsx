import { useState } from 'react'
import { ALL_CLIPS, PACE_META, type Clip, type ClipPace } from '@/data/clips'
import ScriptPlayer from './ScriptPlayer'

const PACE_DOT: Record<ClipPace, string> = {
  clear: 'bg-emerald-500',
  native: 'bg-amber-500',
  fast: 'bg-accent',
}

export default function ShadowPage() {
  const [selected, setSelected] = useState<Clip | null>(null)

  if (selected) {
    return <ScriptPlayer clip={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Step 4 · Shadowing</p>
        <h1 className="font-display text-2xl font-semibold text-ink mt-1">Speak along</h1>
        <p className="text-sm text-ink/60 mt-1.5 leading-relaxed">
          Play a clip and talk at the same time — match the rhythm and intonation with the full script
          in front of you.
        </p>
      </header>

      <ul className="space-y-3">
        {ALL_CLIPS.map((clip) => {
          const pace = PACE_META[clip.pace]
          return (
            <li key={clip.id}>
              <button
                onClick={() => setSelected(clip)}
                className="card w-full text-left hover:border-accent/40 hover:-translate-y-0.5 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <span className="shrink-0 mt-0.5 grid place-items-center w-10 h-10 rounded-xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-paper transition-colors">
                    🎬
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
    </div>
  )
}
