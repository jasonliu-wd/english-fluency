import { useState } from 'react'
import ScriptBrowser from './ScriptBrowser'
import ScriptPlayer from './ScriptPlayer'
import type { Script } from '@/data/scripts/index'

export default function ShadowPage() {
  const [selected, setSelected] = useState<Script | null>(null)

  if (selected) {
    return (
      <ScriptPlayer
        script={selected}
        onBack={() => setSelected(null)}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">📖 Shadow Reading</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Listen sentence by sentence. Read along to build natural rhythm.
        </p>
      </div>
      <ScriptBrowser onSelect={setSelected} />
    </div>
  )
}
