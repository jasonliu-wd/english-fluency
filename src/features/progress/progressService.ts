import { supabase } from '@/lib/supabase'

export type ActivityKey = 'vocab' | 'writing' | 'shadowing' | 'thinking' | 'speaking'

export interface DailyProgress {
  id?: string
  user_id?: string
  date: string
  vocab: boolean
  writing: boolean
  shadowing: boolean
  thinking: boolean
  speaking: boolean
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function countCompleted(p: DailyProgress): number {
  return [p.vocab, p.writing, p.shadowing, p.thinking, p.speaking].filter(Boolean).length
}

export async function fetchTodayProgress(userId: string): Promise<DailyProgress | null> {
  const { data, error } = await supabase
    .from('daily_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('date', todayISO())
    .maybeSingle()

  if (error) console.error('fetchTodayProgress:', error)
  return (data as DailyProgress) ?? null
}

export async function markActivity(
  userId: string,
  activity: ActivityKey,
  done: boolean
): Promise<DailyProgress | null> {
  const { data, error } = await supabase
    .from('daily_progress')
    .upsert(
      { user_id: userId, date: todayISO(), [activity]: done },
      { onConflict: 'user_id,date' }
    )
    .select()
    .maybeSingle()

  if (error) console.error('markActivity:', error)
  if (done && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50)
  return (data as DailyProgress) ?? null
}

export async function fetchLast30Days(userId: string): Promise<DailyProgress[]> {
  const today = new Date()
  const from = new Date(today)
  from.setDate(today.getDate() - 29)

  const { data, error } = await supabase
    .from('daily_progress')
    .select('*')
    .eq('user_id', userId)
    .gte('date', from.toISOString().split('T')[0])
    .lte('date', todayISO())
    .order('date', { ascending: true })

  if (error) console.error('fetchLast30Days:', error)
  return (data as DailyProgress[]) ?? []
}
