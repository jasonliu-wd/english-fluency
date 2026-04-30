// SM-2 spaced repetition algorithm
// https://www.supermemo.com/en/archives1990-2015/english/ol/sm2

export type Rating = 0 | 1 | 2 | 3 // Again=0, Hard=1, Good=2, Easy=3

export type CardSRSFields = {
  interval: number
  ease_factor: number
  repetitions: number
  next_review: string // ISO date string YYYY-MM-DD
}

const QUALITY_MAP: Record<Rating, number> = { 0: 0, 1: 1, 2: 3, 3: 5 }

export function reviewCard(card: CardSRSFields, rating: Rating): CardSRSFields {
  const q = QUALITY_MAP[rating]
  let { interval, ease_factor, repetitions } = card

  ease_factor = Math.max(1.3, ease_factor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))

  if (q < 3) {
    interval = 1
    repetitions = 0
  } else {
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.round(interval * ease_factor)
    repetitions += 1
  }

  const next = new Date()
  next.setDate(next.getDate() + interval)
  const next_review = next.toISOString().split('T')[0]

  return { interval, ease_factor, repetitions, next_review }
}

export function isDue(card: CardSRSFields): boolean {
  const today = new Date().toISOString().split('T')[0]
  return card.next_review <= today
}
