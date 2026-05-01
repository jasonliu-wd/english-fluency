import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

// Public Invidious instances — community-run YouTube proxies not on blocked cloud IPs
// Listed roughly in order of reliability; we try each until one works
const INVIDIOUS = [
  'https://inv.nadeko.net',
  'https://yewtu.be',
  'https://invidious.privacydev.net',
  'https://yt.cdaut.de',
  'https://invidious.io.lol',
]

function parseTimestamp(ts: string): number {
  const parts = ts.replace(',', '.').split(':')
  if (parts.length === 3) return +parts[0] * 3600 + +parts[1] * 60 + parseFloat(parts[2])
  if (parts.length === 2) return +parts[0] * 60 + parseFloat(parts[1])
  return parseFloat(ts)
}

// Parse WebVTT into timestamped segments
function parseVtt(vtt: string): { start: number; end: number; text: string }[] {
  const segments: { start: number; end: number; text: string }[] = []
  const blocks = vtt.split(/\n{2,}/)
  for (const block of blocks) {
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
    if (text && end > start) segments.push({ start, end, text })
  }
  return segments
}

// Parse YouTube json3 caption format
function parseJson3(data: Record<string, unknown>): { start: number; end: number; text: string }[] {
  const events = (data?.events as {tStartMs?: number; dDurationMs?: number; segs?: {utf8?: string}[]}[]) ?? []
  const segments: { start: number; end: number; text: string }[] = []
  for (const ev of events) {
    if (!ev.segs) continue
    const text = ev.segs.map((s) => s.utf8 ?? '').join('').replace(/\n/g, ' ').trim()
    if (!text || text === ' ') continue
    const start = (ev.tStartMs ?? 0) / 1000
    const dur = (ev.dDurationMs ?? 3000) / 1000
    segments.push({ start, end: start + dur, text })
  }
  return segments
}

// Group raw short caption segments into natural sentences for shadowing
function groupIntoSentences(segments: { start: number; end: number; text: string }[]) {
  const sentences: { id: number; start: number; end: number; text: string }[] = []
  let buf: string[] = []
  let bufStart = 0
  let bufEnd = 0
  let nextId = 1

  function flush() {
    const text = buf.join(' ').trim()
    if (text) sentences.push({ id: nextId++, start: bufStart, end: bufEnd, text })
    buf = []
  }

  for (const seg of segments) {
    if (buf.length === 0) bufStart = seg.start
    buf.push(seg.text)
    bufEnd = seg.end
    const combined = buf.join(' ')
    const wordCount = combined.split(/\s+/).length
    const duration = bufEnd - bufStart
    if (/[.!?]\s*$/.test(combined) || wordCount >= 15 || duration >= 7) flush()
  }
  flush()
  return sentences
}

// Try fetching captions via an Invidious instance
async function tryInvidious(
  videoId: string,
  instance: string,
): Promise<{ title: string; segments: { start: number; end: number; text: string }[] } | null> {
  try {
    const timeout = AbortSignal.timeout(6000)

    // 1. Get caption track list
    const listRes = await fetch(`${instance}/api/v1/captions/${videoId}`, {
      headers: { Accept: 'application/json' },
      signal: timeout,
    })
    if (!listRes.ok) return null
    const listData = await listRes.json()
    const captions: { label: string; language_code: string; url: string }[] =
      listData?.captions ?? []
    if (captions.length === 0) return null

    // Prefer English auto-generated, then any English, then first available
    const en =
      captions.find((c) => c.language_code === 'en' && c.label.includes('auto')) ??
      captions.find((c) => c.language_code?.startsWith('en')) ??
      captions[0]

    // 2. Fetch the actual VTT transcript
    const vttUrl = en.url.startsWith('http') ? en.url : `${instance}${en.url}`
    const vttRes = await fetch(vttUrl, { signal: AbortSignal.timeout(8000) })
    if (!vttRes.ok) return null
    const contentType = vttRes.headers.get('content-type') ?? ''

    let segments: { start: number; end: number; text: string }[] = []
    if (contentType.includes('json')) {
      segments = parseJson3(await vttRes.json())
    } else {
      segments = parseVtt(await vttRes.text())
    }
    if (segments.length === 0) return null

    // 3. Also fetch the video title
    let title = 'Custom Video'
    try {
      const infoRes = await fetch(`${instance}/api/v1/videos/${videoId}?fields=title`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(4000),
      })
      if (infoRes.ok) {
        const info = await infoRes.json()
        if (info?.title) title = info.title
      }
    } catch { /* title stays as default */ }

    return { title, segments }
  } catch {
    return null
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { videoId } = await req.json()
    if (!videoId || typeof videoId !== 'string') return json({ error: 'Missing videoId' }, 400)

    // Try each Invidious instance in sequence until one works
    let result: { title: string; segments: { start: number; end: number; text: string }[] } | null = null
    const tried: string[] = []

    for (const instance of INVIDIOUS) {
      result = await tryInvidious(videoId, instance)
      tried.push(`${instance}: ${result ? `✓ ${result.segments.length} segs` : '✗'}`)
      if (result) break
    }

    if (!result) {
      return json({
        error: 'Could not fetch transcript. The video may not have English captions, or all proxy servers are temporarily unavailable.',
        tried,
      }, 404)
    }

    const sentences = groupIntoSentences(result.segments)
    return json({ title: result.title, sentences })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})
