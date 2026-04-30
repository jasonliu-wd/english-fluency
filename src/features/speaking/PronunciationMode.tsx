import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import minimalPairs from '../../data/scripts/minimal-pairs.json'

type Pair = { pair: [string, string]; hint: string }
type Phase = 'pick' | 'listening' | 'recording' | 'result'

const pairs = minimalPairs as Pair[]

export default function PronunciationMode() {
  const { user } = useAuthStore()
  const [idx, setIdx] = useState(0)
  const [targetWord, setTargetWord] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('pick')
  const [heard, setHeard] = useState<string | null>(null)
  const [correct, setCorrect] = useState<boolean | null>(null)
  const [streak, setStreak] = useState(0)
  const [total, setTotal] = useState(0)
  const [saving, setSaving] = useState(false)
  const [sessionDone, setSessionDone] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null)

  const current = pairs[idx]

  function pickTarget() {
    const word = current.pair[Math.floor(Math.random() * 2)]
    setTargetWord(word)
    setHeard(null)
    setCorrect(null)
    playWord(word)
  }

  function playWord(word: string) {
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(word)
    utt.rate = 0.85
    utt.lang = 'en-US'
    utt.onend = () => setPhase('recording')
    window.speechSynthesis.speak(utt)
    setPhase('listening')
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
      const spoken = e.results[0][0].transcript.toLowerCase().trim()
      setHeard(spoken)
      const isCorrect = current.pair.some((w) => spoken.includes(w.toLowerCase()) && w.toLowerCase() === targetWord)
      setCorrect(isCorrect)
      setTotal((t) => t + 1)
      if (isCorrect) setStreak((s) => s + 1)
      else setStreak(0)
      setPhase('result')
    }
    rec.onerror = () => { setCorrect(false); setPhase('result') }
    rec.start()
    recRef.current = rec
  }

  function next() {
    const next = (idx + 1) % pairs.length
    setIdx(next)
    setPhase('pick')
    setTargetWord(null)
  }

  async function endSession() {
    if (!user || total === 0) { setSessionDone(true); return }
    setSaving(true)
    await supabase.from('speaking_sessions').insert({
      user_id: user.id,
      mode: 'pronunciation',
      accuracy_score: Math.round((streak / total) * 100),
      source_text: 'minimal pairs drill',
    })
    setSaving(false)
    setSessionDone(true)
  }

  if (sessionDone) {
    return (
      <div className="card text-center space-y-3 py-8">
        <p className="text-3xl">🎉</p>
        <p className="font-semibold text-gray-800">Session saved!</p>
        <p className="text-sm text-gray-500">You answered {total} pairs.</p>
        <button onClick={() => { setSessionDone(false); setIdx(0); setTotal(0); setStreak(0); setPhase('pick') }} className="btn-primary">
          Start Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">The app says a word — you repeat it. Speech recognition checks which word it heard.</p>

      {/* Stats */}
      <div className="flex gap-3">
        <div className="card flex-1 text-center py-3">
          <p className="text-2xl font-bold text-indigo-600">{streak}</p>
          <p className="text-xs text-gray-500">streak</p>
        </div>
        <div className="card flex-1 text-center py-3">
          <p className="text-2xl font-bold text-gray-700">{total}</p>
          <p className="text-xs text-gray-500">total</p>
        </div>
      </div>

      {/* Current pair */}
      <div className="card space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Minimal Pair #{idx + 1}</p>
          <button onClick={() => setIdx((i) => (i + 1) % pairs.length)} className="text-xs text-gray-400 hover:text-gray-600">skip →</button>
        </div>
        <div className="flex gap-4 justify-center">
          {current.pair.map((w) => (
            <div
              key={w}
              className={`text-2xl font-bold px-4 py-3 rounded-xl border-2 transition-colors ${
                phase === 'result' && targetWord === w
                  ? correct ? 'border-green-400 bg-green-50 text-green-700' : 'border-red-400 bg-red-50 text-red-700'
                  : 'border-gray-200 text-gray-800'
              }`}
            >
              {w}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 text-center italic">{current.hint}</p>
      </div>

      {/* Controls */}
      {phase === 'pick' && (
        <button onClick={pickTarget} className="btn-primary w-full py-3">
          🔊 Play a Word
        </button>
      )}

      {phase === 'listening' && (
        <div className="card text-center text-indigo-600 font-medium text-sm animate-pulse">
          🔊 Listen carefully…
        </div>
      )}

      {phase === 'recording' && (
        <div className="space-y-2">
          <p className="text-center text-sm text-gray-600">Which word did you hear? Repeat it now.</p>
          <button onClick={startRecording} className="btn-primary w-full py-3">
            🎤 Tap & Repeat
          </button>
        </div>
      )}

      {phase === 'result' && (
        <div className="space-y-3">
          <div className={`card text-center py-4 ${correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className="text-2xl mb-1">{correct ? '✅' : '❌'}</p>
            <p className="font-semibold text-gray-800">{correct ? 'Correct!' : `The word was "${targetWord}"`}</p>
            {heard && <p className="text-sm text-gray-500 mt-1">You said: "{heard}"</p>}
          </div>
          <div className="flex gap-3">
            <button onClick={pickTarget} className="btn-secondary flex-1">🔁 Retry pair</button>
            <button onClick={next} className="btn-primary flex-1">Next pair →</button>
          </div>
          <button onClick={endSession} disabled={saving} className="w-full text-sm text-gray-400 hover:text-gray-600 py-1">
            {saving ? 'Saving…' : 'End & save session'}
          </button>
        </div>
      )}
    </div>
  )
}
