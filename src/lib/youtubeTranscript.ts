import type { Script, TimedSentence } from '@/data/scripts/index'

// Invidious instances confirmed to have CORS enabled (browser-callable)
// inv.nadeko.net and yewtu.be sometimes lack English tracks or block CORS
const INVIDIOUS_INSTANCES = [
  'https://invidious.fdn.fr',
  'https://y.com.sb',
  'https://invidious.nerdvpn.de',
  'https://inv.nadeko.net',
  'https://invidious.lunar.icu',
  'https://vid.puffyan.us',
  'https://invidious.privacyredirect.com',
]

export function extractVideoId(input: string): string | null {
  const trimmed = input.trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed
  try {
    const url = new URL(trimmed)
    if (url.hostname === 'youtu.be') return url.pathname.slice(1).split('?')[0] || null
    const v = url.searchParams.get('v')
    if (v) return v
    const m = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/)
    if (m) return m[1]
  } catch { /* not a url */ }
  return null
}

function fetchWithTimeout(url: string, ms = 8000): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id))
}

function parseTimestamp(ts: string): number {
  const parts = ts.replace(',', '.').split(':')
  if (parts.length === 3) return +parts[0] * 3600 + +parts[1] * 60 + parseFloat(parts[2])
  if (parts.length === 2) return +parts[0] * 60 + parseFloat(parts[1])
  return parseFloat(ts)
}

function parseVtt(vtt: string): { start: number; end: number; text: string }[] {
  const segs: { start: number; end: number; text: string }[] = []
  for (const block of vtt.split(/\n{2,}/)) {
    const lines = block.trim().split('\n')
    const tsLine = lines.find((l) => l.includes('-->'))
    if (!tsLine) continue
    const [rawStart, rawEnd] = tsLine.split('-->').map((s) => s.trim().split(/\s/)[0])
    const start = parseTimestamp(rawStart)
    const end = parseTimestamp(rawEnd)
    const tsIdx = lines.indexOf(tsLine)
    const text = lines
      .slice(tsIdx + 1)
      .join(' ')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .trim()
    if (text && end > start) segs.push({ start, end, text })
  }
  return segs
}

function groupIntoSentences(segs: { start: number; end: number; text: string }[]): TimedSentence[] {
  const sentences: TimedSentence[] = []
  let buf: string[] = [], bufStart = 0, bufEnd = 0, nextId = 1
  const flush = () => {
    const text = buf.join(' ').trim()
    if (text) sentences.push({ id: nextId++, start: bufStart, end: bufEnd, text })
    buf = []
  }
  for (const seg of segs) {
    if (buf.length === 0) bufStart = seg.start
    buf.push(seg.text)
    bufEnd = seg.end
    const combined = buf.join(' ')
    if (/[.!?]\s*$/.test(combined) || combined.split(/\s+/).length >= 15 || bufEnd - bufStart >= 7) flush()
  }
  flush()
  return sentences
}

async function tryInstance(
  videoId: string,
  instance: string,
): Promise<{ title: string; sentences: TimedSentence[] } | null> {
  try {
    // 1. Get caption track list
    const listRes = await fetchWithTimeout(`${instance}/api/v1/captions/${videoId}`, 7000)
    if (!listRes.ok) return null
    const listData = await listRes.json()
    const captions: { label: string; language_code: string; url: string }[] =
      listData?.captions ?? []
    if (!captions.length) return null

    // Require English — if this instance has no English captions, skip it
    const track =
      captions.find((c) => c.language_code === 'en' && c.label.toLowerCase().includes('auto')) ??
      captions.find((c) => c.language_code?.startsWith('en')) ??
      captions.find((c) => c.label?.toLowerCase().startsWith('english'))
    if (!track) return null

    // 2. Fetch the VTT caption file
    const vttUrl = track.url.startsWith('http') ? track.url : `${instance}${track.url}`
    const vttRes = await fetchWithTimeout(vttUrl, 8000)
    if (!vttRes.ok) return null
    const vttText = await vttRes.text()

    const segs = parseVtt(vttText)
    if (!segs.length) return null
    const sentences = groupIntoSentences(segs)

    // 3. Fetch video title
    let title = `Video ${videoId}`
    try {
      const infoRes = await fetchWithTimeout(
        `${instance}/api/v1/videos/${videoId}?fields=title`,
        5000,
      )
      if (infoRes.ok) {
        const info = await infoRes.json()
        if (info?.title) title = info.title
      }
    } catch { /* keep default title */ }

    return { title, sentences }
  } catch {
    return null
  }
}

export type TranscriptResult =
  | { ok: true; script: Script }
  | { ok: false; error: string }

export async function fetchTranscriptScript(youtubeUrl: string): Promise<TranscriptResult> {
  const videoId = extractVideoId(youtubeUrl)
  if (!videoId) return { ok: false, error: 'Could not parse a YouTube video ID from that URL.' }

  for (const instance of INVIDIOUS_INSTANCES) {
    const result = await tryInstance(videoId, instance)
    if (result) {
      const script: Script = {
        id: `custom-${videoId}`,
        title: result.title,
        category: 'ted-talk',
        description: `youtube.com/watch?v=${videoId}`,
        youtube_id: videoId,
        sentences: result.sentences,
      }
      return { ok: true, script }
    }
  }

  return {
    ok: false,
    error:
      'Could not load captions. Make sure the video has English subtitles and try again — the proxy servers may be temporarily slow.',
  }
}

// ── localStorage persistence for saved custom videos ──

const STORAGE_KEY = 'enfluency-custom-scripts'

export function loadSavedScripts(): Script[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') }
  catch { return [] }
}

export function saveScript(script: Script): void {
  const next = [script, ...loadSavedScripts().filter((s) => s.id !== script.id)]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, 20)))
}

export function deleteSavedScript(id: string): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(loadSavedScripts().filter((s) => s.id !== id)))
}
