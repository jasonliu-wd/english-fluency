import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { DEV_USER_ID } from '@/lib/constants'

type Phrase = { id: string; phrase: string; source: string | null }
type Writing = { id: string; polished: string; created_at: string }

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  window.speechSynthesis.speak(u)
}

export default function SentenceReview() {
  const { user } = useAuthStore()
  const userId = user?.id ?? DEV_USER_ID
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [writings, setWritings] = useState<Writing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase
        .from('phrase_bank')
        .select('id, phrase, source')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(40),
      supabase
        .from('writing_entries')
        .select('id, polished, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5),
    ]).then(([p, w]) => {
      setPhrases((p.data as Phrase[]) ?? [])
      setWritings((w.data as Writing[]) ?? [])
      setLoading(false)
    })
  }, [userId])

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  if (loading) return <div className="text-center py-16 text-ink/40">Loading…</div>

  const nothing = phrases.length === 0 && writings.length === 0

  if (nothing) {
    return (
      <div className="card text-center py-12">
        <p className="text-4xl mb-3">📖</p>
        <p className="font-display font-semibold text-ink">Nothing to review yet</p>
        <p className="text-sm text-ink/50 mt-1 leading-relaxed">
          Save lines while shadowing, or polish a piece in the Writing Lab — they'll show up here for
          quick re-reading.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {phrases.length > 0 && (
        <section>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink/40 mb-2">
            Saved sentences
          </p>
          <ul className="space-y-2">
            {phrases.map((p) => (
              <li key={p.id} className="card flex items-start gap-3 py-3">
                <button
                  onClick={() => speak(p.phrase)}
                  className="shrink-0 mt-0.5 w-8 h-8 grid place-items-center rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-paper transition-colors"
                  aria-label="Read aloud"
                >
                  ▶
                </button>
                <div className="min-w-0">
                  <p className="text-[15px] leading-relaxed text-ink/85">{p.phrase}</p>
                  {p.source && <p className="text-xs text-ink/40 mt-0.5">{p.source}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {writings.length > 0 && (
        <section>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink/40 mb-2">
            Recent polished writing
          </p>
          <ul className="space-y-2">
            {writings.map((w) => (
              <li key={w.id} className="card py-3">
                <p className="text-[15px] leading-relaxed text-ink/85 whitespace-pre-wrap line-clamp-4">
                  {w.polished}
                </p>
                <p className="text-xs text-ink/40 mt-1.5">
                  {new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
