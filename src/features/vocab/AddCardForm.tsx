import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

type Props = { onAdded: () => void }

export default function AddCardForm({ onAdded }: Props) {
  const { user } = useAuthStore()
  const [word, setWord] = useState('')
  const [meaning, setMeaning] = useState('')
  const [example, setExample] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!word.trim() || !meaning.trim()) return
    setSaving(true)
    setError('')

    const today = new Date().toISOString().split('T')[0]
    const { error } = await supabase.from('vocab_cards').insert({
      user_id: user?.id ?? '',
      word: word.trim(),
      meaning_zh: meaning.trim(),
      example: example.trim() || null,
      next_review: today,
      interval: 1,
      ease_factor: 2.5,
      repetitions: 0,
    })

    if (error) {
      setError(error.message)
    } else {
      setWord('')
      setMeaning('')
      setExample('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
      onAdded()
    }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          English word / phrase <span className="text-red-500">*</span>
        </label>
        <input
          className="input"
          placeholder="e.g. perspective"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Chinese meaning <span className="text-red-500">*</span>
        </label>
        <input
          className="input"
          placeholder="e.g. 观点 / 视角"
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Example sentence <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          className="textarea"
          rows={2}
          placeholder="e.g. From my perspective, this is the right call."
          value={example}
          onChange={(e) => setExample(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-600 font-medium">✓ Card added!</p>}
      <button type="submit" className="btn-primary w-full" disabled={saving}>
        {saving ? 'Saving…' : 'Add card'}
      </button>
    </form>
  )
}
