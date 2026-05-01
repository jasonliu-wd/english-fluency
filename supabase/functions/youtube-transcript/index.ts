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

// Extract the balanced JSON array starting at `html[pos]` (must be '[')
function extractJsonArray(html: string, pos: number): string {
  let depth = 0
  for (let i = pos; i < html.length; i++) {
    if (html[i] === '[') depth++
    else if (html[i] === ']') { depth--; if (depth === 0) return html.slice(pos, i + 1) }
  }
  return '[]'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { videoId } = await req.json()
    if (!videoId || typeof videoId !== 'string') return json({ error: 'Missing videoId' }, 400)

    // Fetch the YouTube watch page
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    if (!pageRes.ok) return json({ error: 'Failed to fetch YouTube page' }, 502)
    const html = await pageRes.text()

    // Extract video title
    const titleMatch = html.match(/<title>([^<]*)<\/title>/)
    const title = titleMatch ? titleMatch[1].replace(/ - YouTube$/, '').trim() : 'Custom Video'

    // Find captionTracks array in ytInitialPlayerResponse
    const marker = '"captionTracks":['
    const markerIdx = html.indexOf(marker)
    if (markerIdx === -1) return json({ error: 'No captions found for this video. Try a video with English subtitles.' }, 404)

    const arrayStart = markerIdx + marker.length - 1
    const rawArray = extractJsonArray(html, arrayStart)

    // Unescape YouTube's JSON encoding
    const unescaped = rawArray
      .replace(/\\u0026/g, '&')
      .replace(/\\\//g, '/')
      .replace(/\\"/g, '"')

    type CaptionTrack = { baseUrl: string; languageCode: string; kind?: string }
    let tracks: CaptionTrack[] = []
    try {
      tracks = JSON.parse(unescaped)
    } catch {
      return json({ error: 'Could not parse caption data' }, 500)
    }

    if (tracks.length === 0) return json({ error: 'No caption tracks available' }, 404)

    // Prefer English auto-generated, then English manual, then first available
    const enAuto = tracks.find((t) => t.languageCode === 'en' && t.kind === 'asr')
    const enManual = tracks.find((t) => t.languageCode === 'en' && t.kind !== 'asr')
    const enAny = tracks.find((t) => t.languageCode?.startsWith('en'))
    const track = enAuto ?? enManual ?? enAny ?? tracks[0]

    // Fetch the transcript XML
    const xmlRes = await fetch(track.baseUrl)
    if (!xmlRes.ok) return json({ error: 'Failed to fetch transcript XML' }, 502)
    const xml = await xmlRes.text()

    // Parse <text start="..." dur="...">...</text> segments
    type Seg = { start: number; end: number; text: string }
    const segments: Seg[] = []
    const segRe = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g
    let m: RegExpExecArray | null
    while ((m = segRe.exec(xml)) !== null) {
      const start = parseFloat(m[1])
      const dur = parseFloat(m[2])
      const text = m[3]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/<[^>]+>/g, '')
        .replace(/\n/g, ' ')
        .trim()
      if (text) segments.push({ start, end: start + dur, text })
    }

    if (segments.length === 0) return json({ error: 'Transcript is empty' }, 404)

    // Group short segments into natural sentences for shadowing
    type Sentence = { id: number; start: number; end: number; text: string }
    const sentences: Sentence[] = []
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
      const endsPunct = /[.!?](\s*)$/.test(combined)

      // Commit when natural sentence end, or >15 words, or >7 seconds
      if (endsPunct || wordCount >= 15 || duration >= 7) flush()
    }
    flush()

    return json({ title, sentences })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})
