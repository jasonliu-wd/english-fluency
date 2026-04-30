import friends from './friends-s01e01.json'
import tedBreneBrown from './ted-brene-brown.json'
import eslDaily from './esl-daily-conversations.json'
import modernFamily from './modern-family-s01e01.json'

export type Script = {
  id: string
  title: string
  category: string
  description: string
  sentences: string[]
}

export const ALL_SCRIPTS: Script[] = [
  friends,
  modernFamily,
  tedBreneBrown,
  eslDaily,
]

export const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'tv-show', label: 'TV Shows' },
  { key: 'ted-talk', label: 'TED Talks' },
  { key: 'esl', label: 'ESL' },
]
