import { useEffect, useRef, useCallback } from 'react'

declare global {
  interface Window {
    YT: {
      Player: new (el: HTMLElement, opts: object) => YTPlayer
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number }
    }
    onYouTubeIframeAPIReady: () => void
  }
}

type YTPlayer = {
  playVideo(): void
  pauseVideo(): void
  seekTo(seconds: number, allowSeek: boolean): void
  getCurrentTime(): number
  getPlayerState(): number
  destroy(): void
}

interface Props {
  videoId: string
  onReady: (player: YTPlayer) => void
  onStateChange?: (state: number) => void
}

let apiLoading = false
let apiReady = false
const readyCallbacks: (() => void)[] = []

function loadYouTubeAPI(cb: () => void) {
  if (apiReady) { cb(); return }
  readyCallbacks.push(cb)
  if (apiLoading) return
  apiLoading = true
  const script = document.createElement('script')
  script.src = 'https://www.youtube.com/iframe_api'
  document.head.appendChild(script)
  window.onYouTubeIframeAPIReady = () => {
    apiReady = true
    readyCallbacks.forEach((fn) => fn())
    readyCallbacks.length = 0
  }
}

export default function YouTubePlayer({ videoId, onReady, onStateChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const onReadyRef = useRef(onReady)
  const onStateChangeRef = useRef(onStateChange)
  onReadyRef.current = onReady
  onStateChangeRef.current = onStateChange

  const initPlayer = useCallback(() => {
    if (!containerRef.current) return
    if (playerRef.current) { playerRef.current.destroy(); playerRef.current = null }

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId,
      playerVars: {
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        controls: 0,
        origin: window.location.origin,
      },
      events: {
        onReady: () => { if (playerRef.current) onReadyRef.current(playerRef.current) },
        onStateChange: (e: { data: number }) => onStateChangeRef.current?.(e.data),
      },
    })
  }, [videoId])

  useEffect(() => {
    loadYouTubeAPI(initPlayer)
    return () => { playerRef.current?.destroy(); playerRef.current = null }
  }, [initPlayer])

  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}

export type { YTPlayer }
