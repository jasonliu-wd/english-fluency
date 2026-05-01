import friends from './friends-s01e01.json'
import tedBreneBrownText from './ted-brene-brown.json'
import eslDaily from './esl-daily-conversations.json'
import modernFamily from './modern-family-s01e01.json'
import simonSinek from './simon-sinek-ted.json'
import steveJobs from './steve-jobs-stanford.json'
import breneBrown from './brene-brown-vulnerability.json'
import obama from './obama-yes-we-can.json'
import mcConaughey from './matthew-mcconaughey-oscar.json'

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
  // YouTube-backed scripts (appear first)
  simonSinek as Script,
  steveJobs as Script,
  breneBrown as Script,
  obama as Script,
  mcConaughey as Script,
  // Text-only scripts
  friends as Script,
  modernFamily as Script,
  tedBreneBrownText as Script,
  eslDaily as Script,
]

export const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'ted-talk', label: 'TED / Speeches' },
  { key: 'tv-show', label: 'TV Shows' },
  { key: 'esl', label: 'ESL' },
]
