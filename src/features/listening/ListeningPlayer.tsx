import { useState } from 'react'
import type { Clip } from '@/data/clips'
import { PACE_META } from '@/data/clips'
import MarkCompleteButton from '@/features/progress/MarkCompleteButton'

interface Props {
  clip: Clip
  onBack: () => void
}

export default function ListeningPlayer({ clip, onBack }: Props) {
  const [showScript, setShowScript] = useState(false)
  const pace = PACE_META[clip.pace]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <button
          onClick={onBack}
          className="text-ink/40 hover:text-ink text-xl leading-none mt-0.5"
          aria-label="Back"
        >
          ←
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl font-semibold text-ink leading-tight">{clip.title}</h1>
          <p className="text-xs text-ink/50 mt-1">
            {clip.source} · {clip.accent} · <span className="text-accent font-medium">{pace.label}</span>
          </p>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden border border-ink/10 shadow-paper">
        <iframe
          className="w-full aspect-video block"
          src={`https://www.youtube-nocookie.com/embed/${clip.youtube_id}?rel=0&modestbranding=1`}
          title={clip.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      <div className="rounded-2xl bg-accent/5 border border-accent/15 px-4 py-3">
        <p className="text-sm text-ink/70 leading-relaxed">
          <span className="font-medium text-ink">Listen first.</span> Try to catch the words without
          reading. Replay the tricky parts, then reveal the script to check yourself.
        </p>
      </div>

      <div>
        <button
          onClick={() => setShowScript((v) => !v)}
          className="w-full flex items-center justify-between rounded-xl border border-ink/10 bg-card px-4 py-3 text-left hover:border-accent/40 transition-colors"
        >
          <span className="text-sm font-medium text-ink">
            {showScript ? 'Hide full script' : 'Reveal full script'}
          </span>
          <span className={`text-ink/40 transition-transform ${showScript ? 'rotate-180' : ''}`}>▾</span>
        </button>

        {showScript && (
          <div className="mt-2 rounded-2xl border border-ink/10 bg-card p-4 space-y-2.5">
            {clip.transcript.map((line, i) => (
              <p key={i} className="text-[15px] leading-relaxed text-ink/85">
                {line}
              </p>
            ))}
          </div>
        )}
      </div>

      <MarkCompleteButton activity="listening" />
    </div>
  )
}
