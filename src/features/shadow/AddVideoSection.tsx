import { useState, useEffect } from 'react'
import type { Script } from '@/data/scripts/index'
import {
  fetchTranscriptScript,
  loadSavedScripts,
  saveScript,
  deleteSavedScript,
} from '@/lib/youtubeTranscript'

interface Props {
  onPlay: (script: Script) => void
}

export default function AddVideoSection({ onPlay }: Props) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState<Script[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => { setSaved(loadSavedScripts()) }, [])

  async function handleLoad() {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    const result = await fetchTranscriptScript(url.trim())
    setLoading(false)
    if (!result.ok) { setError(result.error); return }

    // Auto-save and play
    saveScript(result.script)
    setSaved(loadSavedScripts())
    setUrl('')
    setExpanded(false)
    onPlay(result.script)
  }

  function handleDelete(id: string) {
    deleteSavedScript(id)
    setSaved(loadSavedScripts())
  }

  return (
    <div className="space-y-3">
      {/* Paste URL section */}
      <div className="card space-y-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🔗</span>
            <div>
              <p className="font-semibold text-sm text-gray-900">Add Any YouTube Video</p>
              <p className="text-xs text-gray-400">Paste a URL to auto-generate transcript</p>
            </div>
          </div>
          <span className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
        </button>

        {expanded && (
          <div className="space-y-2 pt-1 border-t border-gray-100">
            <div className="flex gap-2">
              <input
                className="input flex-1 text-sm"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
                disabled={loading}
              />
              <button
                onClick={handleLoad}
                disabled={loading || !url.trim()}
                className="btn-primary shrink-0 text-sm px-4"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Loading
                  </span>
                ) : 'Load'}
              </button>
            </div>

            {loading && (
              <p className="text-xs text-indigo-500 text-center animate-pulse">
                Fetching transcript… this takes a few seconds ⏳
              </p>
            )}

            {error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <p className="text-xs text-gray-400">
              Works with most YouTube videos that have English captions (auto-generated or manual).
            </p>
          </div>
        )}
      </div>

      {/* Saved custom videos */}
      {saved.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-1">My Videos</p>
          {saved.map((script) => (
            <div key={script.id} className="flex items-center gap-2">
              <button
                onClick={() => onPlay(script)}
                className="card flex-1 text-left hover:shadow-md transition-shadow py-3"
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg shrink-0">▶️</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{script.title}</p>
                    <p className="text-xs text-gray-400">{script.sentences.length} sentences</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => handleDelete(script.id)}
                className="text-gray-300 hover:text-red-400 px-2 py-1 transition-colors text-lg"
                aria-label="Delete"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
