import friends from './friends-s01e01.json'
import tedBreneBrown from './ted-brene-brown.json'
import eslDaily from './esl-daily-conversations.json'
import modernFamily from './modern-family-s01e01.json'
import simonSinek from './simon-sinek-ted.json'

export type TimedSentence = {
  id: number
  start: number
  end: number
  text: string
}

export type Script = {
  id: string
  title: string
  category: string
  description: string
  youtube_id?: string
  sentences: string[] | TimedSentence[]
}

export function getSentenceText(s: string | TimedSentence): string {
  return typeof s === 'string' ? s : s.text
}

export function isYouTubeScript(s: Script): s is Script & { youtube_id: string; sentences: TimedSentence[] } {
  return !!s.youtube_id && s.sentences.length > 0 && typeof s.sentences[0] !== 'string'
}

export const ALL_SCRIPTS: Script[] = [
  simonSinek as Script,
  friends as Script,
  modernFamily as Script,
  tedBreneBrown as Script,
  eslDaily as Script,
]

export const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'ted-talk', label: 'TED Talks' },
  { key: 'tv-show', label: 'TV Shows' },
  { key: 'esl', label: 'ESL' },
]
