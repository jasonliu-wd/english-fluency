import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { DEV_USER_ID } from '@/lib/constants'
import type { Clip } from '@/data/clips'
import { PACE_META } from '@/data/clips'
import MarkCompleteButton from '@/features/progress/MarkCompleteButton'

type Props = {
  clip: Clip
  onBack: () => void
}

export default function ScriptPlayer({ clip, onBack }: Props) {
  const { user } = useAuthStore()
  const userId = user?.id ?? DEV_USER_ID
  const pace = PACE_META[clip.pace]

  const [savedIdx, setSavedIdx] = useState<Set<number>>(new Set())
  const [savingIdx, setSavingIdx] = useState<number | null>(null)

  async function savePhrase(line: string, i: number) {
    if (savedIdx.has(i) || savingIdx !== null) return
    setSavingIdx(i)
    await supabase.from('phrase_bank').insert({
      user_id: userId,
      phrase: line,
      source: clip.title,
      context: null,
    })
    setSavedIdx((prev) => new Set([...prev, i]))
    setSavingIdx(null)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
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

      {/* Video */}
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
          <span className="font-medium text-ink">Shadow it.</span> Play the clip and speak along at the
          same time — copy the rhythm, stress, and melody. Tap any line to save it for review.
        </p>
      </div>

      {/* Full script — always visible */}
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink/40 mb-2">Full script</p>
        <div className="rounded-2xl border border-ink/10 bg-card p-4 space-y-1">
          {clip.transcript.map((line, i) => {
            const saved = savedIdx.has(i)
            return (
              <button
                key={i}
                onClick={() => savePhrase(line, i)}
                className={`w-full text-left px-3 py-2 rounded-lg text-[15px] leading-relaxed transition-colors ${
                  saved
                    ? 'bg-accent/10 text-ink'
                    : 'text-ink/85 hover:bg-ink/[0.04]'
                }`}
                title={saved ? 'Saved to review' : 'Tap to save this line'}
              >
                {line}
                {saved && <span className="ml-2 text-xs text-accent">★ saved</span>}
              </button>
            )
          })}
        </div>
      </div>

      <MarkCompleteButton activity="shadowing" />
    </div>
  )
}
