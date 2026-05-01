import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { DEV_USER_ID } from '@/lib/constants'
import WritingForm from './WritingForm'
import WritingList from './WritingList'
import MarkCompleteButton from '@/features/progress/MarkCompleteButton'

type Entry = {
  id: string
  original: string
  polished: string
  tags: string[]
  notes: string | null
  created_at: string
}

type Tab = 'new' | 'history'

export default function WritingPage() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<Tab>('new')
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEntries = useCallback(async () => {
    const { data } = await supabase
      .from('writing_entries')
      .select('*')
      .eq('user_id', user?.id ?? DEV_USER_ID)
      .order('created_at', { ascending: false })
    if (data) setEntries(data)
    setLoading(false)
  }, [user])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  function handleSaved() {
    fetchEntries()
    setTab('history')
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'new', label: 'New entry' },
    { key: 'history', label: `History${entries.length ? ` (${entries.length})` : ''}` },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">✍️ Writing Lab</h1>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
              tab === key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'new' && (
        <div className="card">
          <WritingForm onSaved={handleSaved} />
        </div>
      )}

      {tab === 'history' && (
        loading
          ? <div className="text-center py-16 text-gray-400">Loading…</div>
          : <WritingList entries={entries} onDeleted={fetchEntries} />
      )}

      <MarkCompleteButton activity="writing" />
    </div>
  )
}
