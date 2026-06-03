import type { ActivityKey } from './progressService'

export interface RitualActivity {
  key: Exclude<ActivityKey, 'speaking'>
  step: number
  icon: string
  label: string
  desc: string
  to: string
}

// The daily ritual, in flow order: Listen → Think → Review → Shadow → Write.
export const RITUAL_ACTIVITIES: RitualActivity[] = [
  { key: 'listening', step: 1, icon: '🎧', label: 'Listening', desc: 'Train your ear with real speech', to: '/listening' },
  { key: 'thinking', step: 2, icon: '💭', label: 'Think in English', desc: 'Say your thoughts out loud', to: '/drill' },
  { key: 'vocab', step: 3, icon: '🃏', label: 'Review', desc: 'Cards & saved sentences', to: '/vocab' },
  { key: 'shadowing', step: 4, icon: '🎬', label: 'Shadowing', desc: 'Speak along with the clip', to: '/shadow' },
  { key: 'writing', step: 5, icon: '✍️', label: 'Writing', desc: 'Put it on the page', to: '/writing' },
]
