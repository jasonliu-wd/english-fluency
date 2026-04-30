import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

type Props = { onSaved: () => void }

const PRESET_TAGS = ['email', 'meeting', 'presentation', 'casual', 'grammar', 'vocab', 'tone']

export default function WritingForm({ onSaved }: Props) {
  const { user } = useAuthStore()
  const [original, setOriginal] = useState('')
  const [polished, setPolished] = useState('')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function toggleTag(tag: string) {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!original.trim() || !polished.trim()) return
    setSaving(true)
    setError('')

    const { error } = await supabase.from('writing_entries').insert({
      user_id: user?.id ?? '',
      original: original.trim(),
      polished: polished.trim(),
      tags,
      notes: notes.trim() || null,
    })

    if (error) {
      setError(error.message)
    } else {
      setOriginal('')
      setPolished('')
      setNotes('')
      setTags([])
      onSaved()
    }
    setSaving(false)
  }

  const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Your original draft <span className="text-red-500">*</span>
          </label>
          <span className="text-xs text-gray-400">{wordCount(original)} words</span>
        </div>
        <textarea
          className="textarea"
          rows={5}
          placeholder="Paste or type your original writing here…"
          value={original}
          onChange={(e) => setOriginal(e.target.value)}
          required
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Polished version <span className="text-red-500">*</span>
          </label>
          <span className="text-xs text-gray-400">{wordCount(polished)} words</span>
        </div>
        <textarea
          className="textarea"
          rows={5}
          placeholder="Paste the improved version here…"
          value={polished}
          onChange={(e) => setPolished(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                tags.includes(tag)
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          className="textarea"
          rows={2}
          placeholder="What did you learn from this? e.g. 'Use active voice more often'"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={saving || !original.trim() || !polished.trim()}
      >
        {saving ? 'Saving…' : 'Save entry'}
      </button>
    </form>
  )
}
