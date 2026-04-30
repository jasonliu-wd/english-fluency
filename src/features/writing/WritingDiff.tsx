import { diffWords } from 'diff'

type Props = {
  original: string
  polished: string
}

export default function WritingDiff({ original, polished }: Props) {
  const changes = diffWords(original, polished)

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Diff view</p>
        <div className="text-sm leading-7 bg-gray-50 rounded-lg p-4 border border-gray-100">
          {changes.map((part, i) => {
            if (part.removed) {
              return (
                <span key={i} className="bg-red-100 text-red-700 line-through rounded px-0.5">
                  {part.value}
                </span>
              )
            }
            if (part.added) {
              return (
                <span key={i} className="bg-green-100 text-green-700 rounded px-0.5">
                  {part.value}
                </span>
              )
            }
            return <span key={i} className="text-gray-700">{part.value}</span>
          })}
        </div>
      </div>

      <div className="flex gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-red-100 border border-red-200" />
          Removed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-green-100 border border-green-200" />
          Added
        </span>
      </div>
    </div>
  )
}
