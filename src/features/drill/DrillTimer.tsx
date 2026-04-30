import { useEffect, useRef } from 'react'

type Props = {
  seconds: number
  running: boolean
  onTick: (remaining: number) => void
  onDone: () => void
}

export default function DrillTimer({ seconds, running, onTick, onDone }: Props) {
  const remainingRef = useRef(seconds)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    remainingRef.current = seconds
  }, [seconds])

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      remainingRef.current -= 1
      onTick(remainingRef.current)
      if (remainingRef.current <= 0) {
        clearInterval(intervalRef.current!)
        onDone()
      }
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const pct = seconds > 0 ? (seconds / (mins >= 4 ? 300 : 120)) * 100 : 0

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-5xl font-mono font-bold text-indigo-600 tabular-nums">
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-indigo-500 h-2 rounded-full transition-all duration-1000"
          style={{ width: `${Math.max(0, pct)}%` }}
        />
      </div>
    </div>
  )
}
