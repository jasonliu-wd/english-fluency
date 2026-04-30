import { useState } from 'react'
import WritingDiff from './WritingDiff'
import { supabase } from '@/lib/supabase'

type Entry = {
  id: string
  original: string
  polished: string
  tags: string[]
  notes: string | null
  created_at: string
}

type Props = {
  entries: Entry[]
  onDeleted: () => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function excerpt(text: string, maxChars = 80) {
  return text.length > maxChars ? text.slice(0, maxChars) + '…' : text
}

export default function WritingList({ entries, onDeleted }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [view, setView] = useState<Record<string, 'diff' | 'original' | 'polished'>>({})
  const [deleting, setDeleting] = useState<string | null>(null)

  function getView(id: string) { return view[id] ?? 'diff' }

  async function handleDelete(id: string) {
    if (!confirm('Delete this entry?')) return
    setDeleting(id)
    await supabase.from('writing_entries').delete().eq('id', id)
    setDeleting(null)
    onDeleted()
  }

  if (entries.length === 0) {
    return (
      <div className="card text-center py-12 text-gray-400">
        <p className="text-3xl mb-2">📝</p>
        <p>No entries yet. Add your first one!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const isOpen = expanded === entry.id
        const currentView = getView(entry.id)

        return (
          <div key={entry.id} className="card space-y-3">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400">{formatDate(entry.created_at)}</p>
                <p className="text-sm text-gray-700 mt-0.5 leading-snug">
                  {excerpt(entry.original)}
                </p>
                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {entry.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setExpanded(isOpen ? null : entry.id)}
                className="shrink-0 text-xs text-indigo-600 font-medium hover:underline"
              >
                {isOpen ? 'Close' : 'View diff'}
              </button>
            </div>

            {/* Expanded detail */}
            {isOpen && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                {/* View toggle */}
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  {(['diff', 'original', 'polished'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setView((prev) => ({ ...prev, [entry.id]: v }))}
                      className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors capitalize ${
                        currentView === v ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>

                {currentView === 'diff' && (
                  <WritingDiff original={entry.original} polished={entry.polished} />
                )}
                {currentView === 'original' && (
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-4 border border-gray-100 whitespace-pre-wrap">
                    {entry.original}
                  </p>
                )}
                {currentView === 'polished' && (
                  <p className="text-sm text-gray-700 leading-relaxed bg-green-50 rounded-lg p-4 border border-green-100 whitespace-pre-wrap">
                    {entry.polished}
                  </p>
                )}

                {entry.notes && (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                    <p className="text-xs font-medium text-yellow-700 mb-0.5">Your notes</p>
                    <p className="text-sm text-yellow-800">{entry.notes}</p>
                  </div>
                )}

                <button
                  onClick={() => handleDelete(entry.id)}
                  disabled={deleting === entry.id}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  {deleting === entry.id ? 'Deleting…' : 'Delete entry'}
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
