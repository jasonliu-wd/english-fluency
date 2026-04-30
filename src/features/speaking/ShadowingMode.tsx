import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { ALL_SCRIPTS } from '../../data/scripts/index'

type Phase = 'pick' | 'playing' | 'recording' | 'scored'

function scoreAccuracy(source: string, spoken: string): number {
  const srcWords = source.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean)
  const spkWords = spoken.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean)
  if (srcWords.length === 0) return 0
  const matches = srcWords.filter((w, i) => spkWords[i] === w).length
  return Math.round((matches / srcWords.length) * 100)
}

export default function ShadowingMode() {
  const { user } = useAuthStore()
  const [scriptIdx, setScriptIdx] = useState(0)
  const [sentenceIdx, setSentenceIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('pick')
  const [transcript, setTranscript] = useState('')
  const [score, setScore] = useState<number | null>(null)
  const [scores, setScores] = useState<number[]>([])
  const [speed, setSpeed] = useState(1.0)
  const [saving, setSaving] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null)

  const script = ALL_SCRIPTS[scriptIdx]
  const sentence = script?.sentences[sentenceIdx] ?? ''
  const totalSentences = script?.sentences.length ?? 0

  function speak() {
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(sentence)
    utt.rate = speed
    utt.lang = 'en-US'
    utt.onend = () => setPhase('recording')
    window.speechSynthesis.speak(utt)
    setPhase('playing')
    setTranscript('')
    setScore(null)
  }

  function startRecording() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SR) { alert('Speech recognition not supported.'); return }
    const rec = new SR()
    rec.continuous = false
    rec.interimResults = false
    rec.lang = 'en-US'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const t = e.results[0][0].transcript
      setTranscript(t)
      const s = scoreAccuracy(sentence, t)
      setScore(s)
      setScores((prev) => [...prev, s])
      setPhase('scored')
    }
    rec.onerror = () => setPhase('scored')
    rec.onend = () => { if (phase === 'recording') setPhase('scored') }
    rec.start()
    recRef.current = rec
  }

  function next() {
    if (sentenceIdx < totalSentences - 1) {
      setSentenceIdx((i) => i + 1)
      setPhase('pick')
      setTranscript('')
      setScore(null)
    }
  }

  function prev() {
    if (sentenceIdx > 0) {
      setSentenceIdx((i) => i - 1)
      setPhase('pick')
      setTranscript('')
      setScore(null)
    }
  }

  async function saveSession() {
    if (!user) return
    setSaving(true)
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
    await supabase.from('speaking_sessions').insert({
      user_id: user.id,
      mode: 'shadowing',
      accuracy_score: avg,
      source_text: script?.title ?? null,
    })
    setSaving(false)
    setSentenceIdx(0)
    setScores([])
    setPhase('pick')
  }

  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Listen to each sentence, then immediately repeat it. Get scored on how closely you matched.</p>

      {/* Script selector */}
      <div className="card space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Script</p>
        <select
          value={scriptIdx}
          onChange={(e) => { setScriptIdx(Number(e.target.value)); setSentenceIdx(0); setScores([]); setPhase('pick') }}
          className="input w-full"
        >
          {ALL_SCRIPTS.map((s, i) => (
            <option key={s.id} value={i}>{s.title}</option>
          ))}
        </select>
        {/* Speed */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Speed:</span>
          {[0.7, 1.0, 1.2].map((r) => (
            <button
              key={r}
              onClick={() => setSpeed(r)}
              className={`text-xs px-3 py-1 rounded-lg border font-medium transition-colors ${
                speed === r ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}
            >
              {r}×
            </button>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{sentenceIdx + 1} / {totalSentences}</span>
        {avgScore !== null && <span>Avg score: <strong className="text-indigo-600">{avgScore}%</strong></span>}
      </div>

      {/* Current sentence */}
      <div className="card bg-indigo-50 border border-indigo-200">
        <p className="text-base font-medium text-gray-900 leading-relaxed">{sentence}</p>
      </div>

      {/* Controls */}
      {phase === 'pick' && (
        <button onClick={speak} className="btn-primary w-full py-3">
          🔊 Play & Shadow
        </button>
      )}
      {phase === 'playing' && (
        <div className="card text-center text-indigo-600 font-medium text-sm animate-pulse">
          🔊 Listen carefully…
        </div>
      )}
      {phase === 'recording' && (
        <div className="space-y-3">
          <div className="card text-center text-red-500 font-medium text-sm">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2" />
            Now you say it!
          </div>
          <button onClick={startRecording} className="btn-primary w-full">
            🎤 Tap to Record
          </button>
        </div>
      )}
      {phase === 'scored' && (
        <div className="space-y-3">
          {score !== null && (
            <div className="card text-center">
              <p className={`text-4xl font-bold ${score >= 70 ? 'text-green-600' : score >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
                {score}%
              </p>
              <p className="text-sm text-gray-500 mt-1">{transcript || 'Nothing detected'}</p>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={speak} className="btn-secondary flex-1">🔁 Retry</button>
            {sentenceIdx < totalSentences - 1
              ? <button onClick={next} className="btn-primary flex-1">Next →</button>
              : <button onClick={saveSession} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : 'Save Session'}</button>
            }
          </div>
        </div>
      )}

      {/* Prev/Next nav */}
      <div className="flex gap-2">
        <button onClick={prev} disabled={sentenceIdx === 0} className="btn-secondary flex-1 disabled:opacity-40">← Prev</button>
        <button onClick={next} disabled={sentenceIdx >= totalSentences - 1} className="btn-secondary flex-1 disabled:opacity-40">Next →</button>
      </div>
    </div>
  )
}
