import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import DrillTimer from './DrillTimer'
import promptsData from '../../data/drill-prompts/prompts.json'
import MarkCompleteButton from '@/features/progress/MarkCompleteButton'

type DrillSessionRow = {
  id: string
  user_id: string
  prompt: string
  transcript: string | null
  duration_seconds: number | null
  created_at: string
}

type Category = keyof typeof promptsData.categories | 'random'

const CATEGORY_LABELS: Record<Category, string> = {
  random: '🎲 Random',
  opinion: '💬 Opinion',
  storytelling: '📖 Storytelling',
  hypothetical: '🤔 Hypothetical',
  work: '💼 Work',
  daily: '☀️ Daily Life',
}

const DURATIONS = [
  { label: '2 min', seconds: 120 },
  { label: '5 min', seconds: 300 },
]

type Phase = 'pick' | 'ready' | 'running' | 'done'

function pickPrompt(category: Category): string {
  const all = promptsData.categories
  if (category === 'random') {
    const cats = Object.values(all).flat()
    return cats[Math.floor(Math.random() * cats.length)]
  }
  const list = all[category]
  return list[Math.floor(Math.random() * list.length)]
}

export default function DrillPage() {
  const { user } = useAuthStore()

  const [phase, setPhase] = useState<Phase>('pick')
  const [category, setCategory] = useState<Category>('random')
  const [durationIdx, setDurationIdx] = useState(0)
  const [prompt, setPrompt] = useState('')
  const [timeLeft, setTimeLeft] = useState(DURATIONS[0].seconds)
  const [timerRunning, setTimerRunning] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [micActive, setMicActive] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sessions, setSessions] = useState<DrillSessionRow[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const totalSeconds = DURATIONS[durationIdx].seconds

  useEffect(() => {
    if (!user) return
    fetchSessions()
  }, [user])

  async function fetchSessions() {
    setLoadingSessions(true)
    const { data } = await supabase
      .from('drill_sessions')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setSessions((data as DrillSessionRow[]) ?? [])
    setLoadingSessions(false)
  }

  function startSession() {
    const p = pickPrompt(category)
    setPrompt(p)
    setTimeLeft(totalSeconds)
    setTranscript('')
    setInterimTranscript('')
    setPhase('ready')
  }

  function beginTimer() {
    setTimerRunning(true)
    setPhase('running')
  }

  function handleTick(remaining: number) {
    setTimeLeft(remaining)
  }

  function handleDone() {
    setTimerRunning(false)
    stopMic()
    setPhase('done')
  }

  function stopEarly() {
    setTimerRunning(false)
    stopMic()
    setPhase('done')
  }

  function toggleMic() {
    if (micActive) {
      stopMic()
    } else {
      startMic()
    }
  }

  function startMic() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onresult = (e: any) => {
      let final = ''
      let interim = ''
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript + ' '
        } else {
          interim += e.results[i][0].transcript
        }
      }
      setTranscript(final)
      setInterimTranscript(interim)
    }
    rec.onerror = () => setMicActive(false)
    rec.onend = () => setMicActive(false)
    rec.start()
    recognitionRef.current = rec
    setMicActive(true)
  }

  function stopMic() {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setMicActive(false)
    setInterimTranscript('')
  }

  async function saveSession() {
    if (!user) return
    setSaving(true)
    const fullTranscript = transcript.trim() || null
    await supabase.from('drill_sessions').insert({
      user_id: user.id,
      prompt,
      transcript: fullTranscript,
      duration_seconds: totalSeconds - timeLeft,
    })
    setSaving(false)
    setPhase('pick')
    fetchSessions()
  }

  function discardSession() {
    setPhase('pick')
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function formatDuration(s: number | null) {
    if (!s) return ''
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  if (phase === 'ready' || phase === 'running' || phase === 'done') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { stopMic(); setTimerRunning(false); setPhase('pick') }}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-gray-900">💭 Think in English</h1>
        </div>

        {/* Prompt */}
        <div className="card bg-indigo-50 border border-indigo-200">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-1">Your Prompt</p>
          <p className="text-lg font-medium text-gray-900 leading-snug">{prompt}</p>
        </div>

        {/* Timer */}
        <div className="card">
          <DrillTimer
            seconds={timeLeft}
            running={timerRunning}
            onTick={handleTick}
            onDone={handleDone}
          />
          <div className="flex gap-3 mt-4 justify-center">
            {phase === 'ready' && (
              <button onClick={beginTimer} className="btn-primary px-8">
                Start
              </button>
            )}
            {phase === 'running' && (
              <>
                <button onClick={stopEarly} className="btn-secondary">
                  Stop Early
                </button>
                <button
                  onClick={toggleMic}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    micActive
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🎤 {micActive ? 'Stop Mic' : 'Use Mic'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Live transcript */}
        {(phase === 'running' || phase === 'done') && (transcript || interimTranscript) && (
          <div className="card">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Transcript</p>
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              {transcript}
              {interimTranscript && (
                <span className="text-gray-400 italic">{interimTranscript}</span>
              )}
            </p>
          </div>
        )}

        {/* Done actions */}
        {phase === 'done' && (
          <div className="card space-y-3">
            <p className="font-semibold text-gray-700 text-center">Session complete!</p>
            <div className="flex gap-3">
              <button onClick={saveSession} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving…' : 'Save Session'}
              </button>
              <button onClick={discardSession} className="btn-secondary flex-1">
                Discard
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">💭 Think in English</h1>
      <p className="text-sm text-gray-500">Pick a category, start a timer, and think or speak freely in English.</p>

      {/* Category picker */}
      <div className="card space-y-3">
        <p className="text-sm font-semibold text-gray-700">Category</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors text-left ${
                category === cat
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Duration picker */}
      <div className="card space-y-3">
        <p className="text-sm font-semibold text-gray-700">Duration</p>
        <div className="flex gap-2">
          {DURATIONS.map((d, i) => (
            <button
              key={d.label}
              onClick={() => setDurationIdx(i)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                durationIdx === i
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <button onClick={startSession} className="btn-primary w-full py-3 text-base">
        Get a Prompt →
      </button>

      {/* Past sessions */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700">Past Sessions</p>
        {loadingSessions ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : sessions.length === 0 ? (
          <div className="card text-center text-gray-400 py-8">
            <p className="text-2xl mb-2">🗣️</p>
            <p className="text-sm">No sessions yet. Start your first drill!</p>
          </div>
        ) : (
          sessions.map((s) => (
            <div key={s.id} className="card space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">{formatDate(s.created_at)}{s.duration_seconds ? ` · ${formatDuration(s.duration_seconds)}` : ''}</p>
              </div>
              <p className="text-sm font-medium text-gray-800">{s.prompt}</p>
              {s.transcript && (
                <p className="text-sm text-gray-500 line-clamp-2">{s.transcript}</p>
              )}
            </div>
          ))
        )}
      </div>

      <MarkCompleteButton activity="thinking" />
    </div>
  )
}
