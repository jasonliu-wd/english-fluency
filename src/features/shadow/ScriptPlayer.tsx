import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { DEV_USER_ID } from '@/lib/constants'
import type { Script, TimedSentence } from '@/data/scripts/index'
import { getSentenceText, isYouTubeScript } from '@/data/scripts/index'
import YouTubePlayer, { type YTPlayer } from './YouTubePlayer'

type Props = {
  script: Script
  onBack: () => void
}

const SPEEDS = [0.7, 1.0, 1.25, 1.5]

// Binary search for the sentence active at `time`
function findActiveSentence(sentences: TimedSentence[], time: number): number {
  let lo = 0
  let hi = sentences.length - 1
  let found = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (sentences[mid].start <= time) {
      if (sentences[mid].end >= time) { found = mid; break }
      found = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return found
}

export default function ScriptPlayer({ script, onBack }: Props) {
  const { user } = useAuthStore()
  const isYT = isYouTubeScript(script)

  // ── shared state ──
  const [index, setIndex] = useState(0)
  const [savedIdx, setSavedIdx] = useState<Set<number>>(new Set())
  const [savingPhrase, setSavingPhrase] = useState(false)
  const total = script.sentences.length
  const current = getSentenceText(script.sentences[index])

  // ── text-only (TTS) state ──
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1.0)
  const [autoPlay, setAutoPlay] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // ── YouTube state ──
  const playerRef = useRef<YTPlayer | null>(null)
  const [ytPlaying, setYtPlaying] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const sentenceRefs = useRef<(HTMLDivElement | null)[]>([])

  // ── scroll active sentence into view ──
  useEffect(() => {
    if (!isYT) return
    const el = sentenceRefs.current[index]
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [index, isYT])

  // ── YouTube polling for active sentence ──
  useEffect(() => {
    if (!isYT) return
    pollRef.current = setInterval(() => {
      if (!playerRef.current) return
      const state = playerRef.current.getPlayerState()
      setYtPlaying(state === 1) // YT.PlayerState.PLAYING = 1
      if (state !== 1) return
      const t = playerRef.current.getCurrentTime()
      const sentences = script.sentences as TimedSentence[]
      const found = findActiveSentence(sentences, t)
      if (found >= 0) setIndex(found)
    }, 200)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [isYT, script.sentences])

  // ── TTS helpers ──
  const stopSpeech = useCallback(() => {
    window.speechSynthesis.cancel()
    setPlaying(false)
  }, [])

  const speak = useCallback((text: string, onEnd?: () => void) => {
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = speed
    utter.lang = 'en-US'
    const voices = window.speechSynthesis.getVoices()
    const enVoice = voices.find((v) => v.lang.startsWith('en-') && v.localService)
      ?? voices.find((v) => v.lang.startsWith('en-'))
    if (enVoice) utter.voice = enVoice
    utter.onstart = () => setPlaying(true)
    utter.onend = () => { setPlaying(false); onEnd?.() }
    utter.onerror = () => setPlaying(false)
    utteranceRef.current = utter
    window.speechSynthesis.speak(utter)
  }, [speed])

  const advance = useCallback(() => {
    setIndex((prev) => {
      const next = prev + 1
      if (next >= total) return prev
      if (autoPlay) {
        setTimeout(() => {
          speak(getSentenceText(script.sentences[next]), () => {
            setIndex((cur) => {
              const after = cur + 1
              if (after < total && autoPlay) {
                setTimeout(() => speak(getSentenceText(script.sentences[after])), 300)
                return after
              }
              return cur
            })
          })
        }, 300)
      }
      return next
    })
  }, [autoPlay, total, script.sentences, speak])

  function handlePlay() {
    if (isYT) {
      if (!playerRef.current) return
      if (ytPlaying) playerRef.current.pauseVideo()
      else playerRef.current.playVideo()
    } else {
      if (playing) stopSpeech()
      else speak(current, autoPlay ? advance : undefined)
    }
  }

  function goNext() {
    if (isYT) {
      const sentences = script.sentences as TimedSentence[]
      const next = Math.min(index + 1, total - 1)
      playerRef.current?.seekTo(sentences[next].start, true)
      setIndex(next)
    } else {
      stopSpeech()
      if (index < total - 1) setIndex(index + 1)
    }
  }

  function goPrev() {
    if (isYT) {
      const sentences = script.sentences as TimedSentence[]
      const prev = Math.max(index - 1, 0)
      playerRef.current?.seekTo(sentences[prev].start, true)
      setIndex(prev)
    } else {
      stopSpeech()
      if (index > 0) setIndex(index - 1)
    }
  }

  function seekToSentence(i: number) {
    if (!isYT) return
    const sentences = script.sentences as TimedSentence[]
    playerRef.current?.seekTo(sentences[i].start, true)
    setIndex(i)
  }

  function repeatSentence() {
    if (!isYT) return
    const sentences = script.sentences as TimedSentence[]
    playerRef.current?.seekTo(sentences[index].start, true)
    playerRef.current?.playVideo()
  }

  // keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') { e.preventDefault(); handlePlay() }
      if (e.code === 'ArrowRight') goNext()
      if (e.code === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => () => { window.speechSynthesis.cancel() }, [])

  async function savePhrase() {
    setSavingPhrase(true)
    await supabase.from('phrase_bank').insert({
      user_id: user?.id ?? DEV_USER_ID,
      phrase: current,
      source: script.title,
      context: null,
    })
    setSavedIdx((prev) => new Set([...prev, index]))
    setSavingPhrase(false)
  }

  const alreadySaved = savedIdx.has(index)
  const isPlayingNow = isYT ? ytPlaying : playing

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { stopSpeech(); onBack() }}
          className="text-gray-400 hover:text-gray-600 text-lg"
        >
          ←
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">{script.title}</p>
          <p className="text-xs text-gray-400">{index + 1} / {total}</p>
        </div>
        {isYT && (
          <span className="text-xs bg-red-50 text-red-600 border border-red-200 rounded px-1.5 py-0.5 shrink-0">
            ▶ YouTube
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-1">
        <div
          className="bg-indigo-500 h-1 rounded-full transition-all"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      {/* YouTube embed + scrollable transcript */}
      {isYT ? (
        <>
          <YouTubePlayer
            videoId={script.youtube_id!}
            onReady={(p) => { playerRef.current = p }}
            onStateChange={(s) => setYtPlaying(s === 1)}
          />

          {/* Transcript */}
          <div
            ref={transcriptRef}
            className="max-h-56 overflow-y-auto space-y-1 rounded-xl border border-gray-100 bg-white p-3"
          >
            {(script.sentences as TimedSentence[]).map((s, i) => (
              <div
                key={s.id}
                ref={(el) => { sentenceRefs.current[i] = el }}
                onClick={() => seekToSentence(i)}
                className={`px-3 py-2 rounded-lg cursor-pointer text-sm leading-relaxed transition-colors ${
                  i === index
                    ? 'bg-indigo-50 text-indigo-900 font-medium ring-1 ring-indigo-200'
                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                {s.text}
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Text-only sentence display */
        <div className="space-y-2">
          {index > 0 && (
            <p className="text-sm text-gray-300 leading-relaxed px-1 line-clamp-2">
              {getSentenceText(script.sentences[index - 1])}
            </p>
          )}
          <div className="card bg-indigo-50 border-indigo-100 min-h-28 flex items-center justify-center">
            <p className="text-xl font-medium text-gray-900 text-center leading-relaxed">
              {current}
            </p>
          </div>
          {index < total - 1 && (
            <p className="text-sm text-gray-300 leading-relaxed px-1 line-clamp-2">
              {getSentenceText(script.sentences[index + 1])}
            </p>
          )}
        </div>
      )}

      {/* Play controls */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={goPrev}
          disabled={index === 0}
          className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-2xl px-2"
        >
          ⏮
        </button>
        <button
          onClick={handlePlay}
          className="bg-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl hover:bg-indigo-700 shadow-md transition-colors"
        >
          {isPlayingNow ? '⏸' : '▶'}
        </button>
        <button
          onClick={goNext}
          disabled={index === total - 1}
          className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-2xl px-2"
        >
          ⏭
        </button>
      </div>

      {/* Options card */}
      <div className="card space-y-3">
        {isYT ? (
          <button
            onClick={repeatSentence}
            className="w-full text-xs py-2 rounded-lg border border-indigo-300 text-indigo-600 hover:bg-indigo-50 font-medium"
          >
            🔁 Repeat this sentence
          </button>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Speed</span>
              <div className="flex gap-1">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      speed === s
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                    }`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Auto-advance</span>
              <button
                onClick={() => setAutoPlay((v) => !v)}
                className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
                  autoPlay ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
                  autoPlay ? 'translate-x-4' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </>
        )}

        <button
          onClick={savePhrase}
          disabled={savingPhrase || alreadySaved}
          className={`w-full text-xs py-2 rounded-lg border font-medium transition-colors ${
            alreadySaved
              ? 'border-green-300 text-green-600 bg-green-50'
              : 'border-indigo-300 text-indigo-600 hover:bg-indigo-50 disabled:opacity-50'
          }`}
        >
          {alreadySaved ? '✓ Saved to phrase bank' : savingPhrase ? 'Saving…' : '📌 Save to phrase bank'}
        </button>
      </div>

      <p className="text-xs text-center text-gray-300">
        {isYT ? 'Click any sentence to jump · ← → to navigate' : 'Space to play/pause · ← → to navigate'}
      </p>
    </div>
  )
}
