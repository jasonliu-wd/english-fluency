import { useState } from 'react'
import ReadAloudMode from './ReadAloudMode'
import ShadowingMode from './ShadowingMode'
import PronunciationMode from './PronunciationMode'
import MarkCompleteButton from '@/features/progress/MarkCompleteButton'

type Mode = 'read_aloud' | 'shadowing' | 'pronunciation'

const MODES: { key: Mode; label: string; icon: string; desc: string }[] = [
  { key: 'read_aloud', label: 'Read Aloud', icon: '📖', desc: 'Read a passage and score your accuracy' },
  { key: 'shadowing', label: 'Shadowing', icon: '🪞', desc: 'Listen then immediately repeat each sentence' },
  { key: 'pronunciation', label: 'Minimal Pairs', icon: '🔤', desc: 'Drill similar-sounding words to sharpen your ear' },
]

export default function SpeakingPage() {
  const [mode, setMode] = useState<Mode | null>(null)

  if (mode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setMode(null)} className="text-sm text-gray-500 hover:text-gray-700">
            ← Modes
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            {MODES.find((m) => m.key === mode)?.icon}{' '}
            {MODES.find((m) => m.key === mode)?.label}
          </h1>
        </div>
        {mode === 'read_aloud' && <ReadAloudMode />}
        {mode === 'shadowing' && <ShadowingMode />}
        {mode === 'pronunciation' && <PronunciationMode />}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">🎙️ Speaking Practice</h1>
      <p className="text-sm text-gray-500">Choose a practice mode to get started.</p>
      <div className="space-y-3">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className="card w-full text-left hover:border-indigo-300 border border-transparent transition-colors flex items-start gap-3"
          >
            <span className="text-3xl">{m.icon}</span>
            <div>
              <p className="font-semibold text-gray-900">{m.label}</p>
              <p className="text-sm text-gray-500">{m.desc}</p>
            </div>
            <span className="ml-auto text-gray-300 text-lg self-center">›</span>
          </button>
        ))}
      </div>

      <MarkCompleteButton activity="speaking" />
    </div>
  )
}
