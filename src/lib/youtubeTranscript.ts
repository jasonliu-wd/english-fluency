import { supabase } from './supabase'
import type { Script, TimedSentence } from '@/data/scripts/index'

export function extractVideoId(input: string): string | null {
  const trimmed = input.trim()
  // Already a bare video ID (11 chars, alphanumeric + - _)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed

  try {
    const url = new URL(trimmed)
    // youtu.be/ID
    if (url.hostname === 'youtu.be') return url.pathname.slice(1).split('?')[0] || null
    // youtube.com/watch?v=ID
    const v = url.searchParams.get('v')
    if (v) return v
    // youtube.com/embed/ID
    const embedMatch = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/)
    if (embedMatch) return embedMatch[1]
  } catch {
    // not a URL
  }
  return null
}

export type TranscriptResult =
  | { ok: true; script: Script }
  | { ok: false; error: string }

export async function fetchTranscriptScript(youtubeUrl: string): Promise<TranscriptResult> {
  const videoId = extractVideoId(youtubeUrl)
  if (!videoId) return { ok: false, error: 'Could not parse a YouTube video ID from that URL.' }

  const { data, error } = await supabase.functions.invoke('youtube-transcript', {
    body: { videoId },
  })

  if (error) return { ok: false, error: error.message ?? 'Network error calling transcript function.' }
  if (data?.error) return { ok: false, error: data.error }

  const sentences: TimedSentence[] = data.sentences
  if (!sentences?.length) return { ok: false, error: 'No transcript sentences returned.' }

  const script: Script = {
    id: `custom-${videoId}`,
    title: data.title ?? 'Custom Video',
    category: 'ted-talk',
    description: `YouTube: ${videoId}`,
    youtube_id: videoId,
    sentences,
  }

  return { ok: true, script }
}

// ── localStorage persistence for custom saved videos ──

const STORAGE_KEY = 'enfluency-custom-scripts'

export function loadSavedScripts(): Script[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveScript(script: Script): void {
  const existing = loadSavedScripts()
  const next = [script, ...existing.filter((s) => s.id !== script.id)]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, 20))) // cap at 20
}

export function deleteSavedScript(id: string): void {
  const next = loadSavedScripts().filter((s) => s.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}
