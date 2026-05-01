import { useState } from 'react'
import { ALL_SCRIPTS, CATEGORIES, isYouTubeScript, type Script } from '@/data/scripts/index'

const CATEGORY_ICONS: Record<string, string> = {
  'tv-show': '📺',
  'ted-talk': '🎤',
  'esl': '💬',
}

type Props = {
  onSelect: (script: Script) => void
}

export default function ScriptBrowser({ onSelect }: Props) {
  const [category, setCategory] = useState('all')

  const filtered = category === 'all'
    ? ALL_SCRIPTS
    : ALL_SCRIPTS.filter((s) => s.category === category)

  return (
    <div className="space-y-4">
      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              category === key
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Script cards */}
      <div className="space-y-3">
        {filtered.map((script) => (
          <button
            key={script.id}
            onClick={() => onSelect(script)}
            className="card w-full text-left hover:shadow-md transition-shadow space-y-1.5"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0 mt-0.5">
                {CATEGORY_ICONS[script.category] ?? '📄'}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900 leading-snug">{script.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">{script.description}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-indigo-500">
                    {script.sentences.length} sentences
                  </span>
                  {isYouTubeScript(script) && (
                    <span className="text-xs bg-red-50 text-red-600 border border-red-200 rounded px-1.5 py-0.5">
                      ▶ YouTube
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
