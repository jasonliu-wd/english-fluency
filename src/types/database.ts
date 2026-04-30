type WritingEntryRow = {
  id: string
  user_id: string
  original: string
  polished: string
  tags: string[]
  notes: string | null
  created_at: string
}

type VocabCardRow = {
  id: string
  user_id: string
  word: string
  meaning_zh: string
  example: string | null
  next_review: string
  interval: number
  ease_factor: number
  repetitions: number
  created_at: string
}

type DrillSessionRow = {
  id: string
  user_id: string
  prompt: string
  transcript: string | null
  duration_seconds: number | null
  created_at: string
}

type SpeakingSessionRow = {
  id: string
  user_id: string
  mode: 'read_aloud' | 'shadowing' | 'pronunciation'
  accuracy_score: number | null
  source_text: string | null
  created_at: string
}

type PhraseBankRow = {
  id: string
  user_id: string
  phrase: string
  context: string | null
  source: string | null
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      writing_entries: {
        Row: WritingEntryRow
        Insert: Omit<WritingEntryRow, 'id' | 'created_at'>
        Update: Partial<Omit<WritingEntryRow, 'id' | 'created_at'>>
      }
      vocab_cards: {
        Row: VocabCardRow
        Insert: Omit<VocabCardRow, 'id' | 'created_at'>
        Update: Partial<Omit<VocabCardRow, 'id' | 'created_at'>>
      }
      drill_sessions: {
        Row: DrillSessionRow
        Insert: Omit<DrillSessionRow, 'id' | 'created_at'>
        Update: Partial<Omit<DrillSessionRow, 'id' | 'created_at'>>
      }
      speaking_sessions: {
        Row: SpeakingSessionRow
        Insert: Omit<SpeakingSessionRow, 'id' | 'created_at'>
        Update: Partial<Omit<SpeakingSessionRow, 'id' | 'created_at'>>
      }
      phrase_bank: {
        Row: PhraseBankRow
        Insert: Omit<PhraseBankRow, 'id' | 'created_at'>
        Update: Partial<Omit<PhraseBankRow, 'id' | 'created_at'>>
      }
    }
  }
}
