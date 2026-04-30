import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import readAloudTexts from '../../data/scripts/read-aloud-texts.json'

type Text = { id: string; title: string; level: string; text: string }

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
}

function scoreAccuracy(source: string, spoken: string): number {
  const srcWords = source.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean)
  const spkWords = spoken.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean)
  if (srcWords.length === 0) return 0
  const matches = srcWords.filter((w, i) => spkWords[i] === w).length
  return Math.round((matches / srcWords.length) * 100)
}

function highlightMissed(source: string, spoken: string) {
  const srcWords = source.split(/(\s+)/)
  const spkWords = spoken.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean)
  let spkIdx = 0
  return srcWords.map((token, i) => {
    if (/^\s+$/.test(token)) return <span key={i}>{token}</span>
    const clean = token.toLowerCase().replace(/[^a-z]/g, '')
    const matched = spkWords[spkIdx] === clean
    if (clean) spkIdx++
    return (
      <span key={i} className={matched ? 'text-gray-900' : 'bg-red-100 text-red-700 rounded px-0.5'}>
        {token}
      </span>
    )
  })
}

export default function ReadAloudMode() {
  const { user } = useAuthStore()
  const [selected, setSelected] = useState<Text | null>(null)
  const [phase, setPhase] = useState<'pick' | 'ready' | 'recording' | 'done'>('pick')
  const [transcript, setTranscript] = useState('')
  const [score, setScore] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null)

  function selectText(t: Text) {
    setSelected(t)
    setPhase('ready')
    setTranscript('')
    setScore(null)
  }

  function startRecording() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SR) { alert('Speech recognition is not supported in this browser.'); return }
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = false
    rec.lang = 'en-US'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let text = ''
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript + ' '
      }
      setTranscript(text.trim())
    }
    rec.onend = () => setPhase('done')
    rec.start()
    recRef.current = rec
    setPhase('recording')
  }

  function stopRecording() {
    recRef.current?.stop()
    recRef.current = null
  }

  function computeScore() {
    if (!selected || !transcript) return
    const s = scoreAccuracy(selected.text, transcript)
    setScore(s)
  }

  async function saveResult() {
    if (!user || !selected) return
    setSaving(true)
    const s = score ?? scoreAccuracy(selected.text, transcript)
    await supabase.from('speaking_sessions').insert({
      user_id: user.id,
      mode: 'read_aloud',
      accuracy_score: s,
      source_text: selected.text,
    })
    setSaving(false)
    setPhase('pick')
    setSelected(null)
  }

  if (phase !== 'pick') {
    return (
      <div className="space-y-4">
        <button onClick={() => { stopRecording(); setPhase('pick') }} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to texts
        </button>

        <div className="card bg-indigo-50 border border-indigo-200 space-y-1">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">{selected!.title}</p>
          <p className="text-sm leading-relaxed text-gray-900">
            {phase === 'done' && transcript
              ? highlightMissed(selected!.text, transcript)
              : selected!.text}
          </p>
        </div>

        {phase === 'ready' && (
          <button onClick={startRecording} className="btn-primary w-full py-3">
            🎤 Start Recording
          </button>
        )}

        {phase === 'recording' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-red-500 font-medium text-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Recording… read the text above aloud
            </div>
            <button onClick={stopRecording} className="btn-secondary w-full">
              Stop Recording
            </button>
          </div>
        )}

        {phase === 'done' && (
          <div className="space-y-3">
            {transcript && score === null && (
              <button onClick={computeScore} className="btn-primary w-full">
                Check My Score
              </button>
            )}
            {score !== null && (
              <div className="card text-center">
                <p className="text-4xl font-bold text-indigo-600">{score}%</p>
                <p className="text-sm text-gray-500 mt-1">accuracy</p>
                <p className="text-xs text-gray-400 mt-2">Red words were missed or misheard</p>
              </div>
            )}
            {transcript && (
              <div className="card">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">What was heard</p>
                <p className="text-sm text-gray-700">{transcript}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={saveResult} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving…' : 'Save Result'}
              </button>
              <button onClick={() => setPhase('ready')} className="btn-secondary flex-1">
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">Read a passage aloud and get an accuracy score based on speech recognition.</p>
      {(readAloudTexts as Text[]).map((t) => (
        <button key={t.id} onClick={() => selectText(t)} className="card w-full text-left hover:border-indigo-300 border border-transparent transition-colors">
          <div className="flex items-center justify-between mb-1">
            <p className="font-medium text-gray-900 text-sm">{t.title}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[t.level] ?? 'bg-gray-100 text-gray-600'}`}>
              {t.level}
            </span>
          </div>
          <p className="text-xs text-gray-500 line-clamp-2">{t.text}</p>
        </button>
      ))}
    </div>
  )
}
