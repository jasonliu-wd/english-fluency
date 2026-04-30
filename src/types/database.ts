export type Database = {
  public: {
    Tables: {
      writing_entries: {
        Row: {
          id: string
          user_id: string
          original: string
          polished: string
          tags: string[]
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['writing_entries']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['writing_entries']['Insert']>
      }
      vocab_cards: {
        Row: {
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
        Insert: Omit<Database['public']['Tables']['vocab_cards']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['vocab_cards']['Insert']>
      }
      drill_sessions: {
        Row: {
          id: string
          user_id: string
          prompt: string
          transcript: string | null
          duration_seconds: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['drill_sessions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['drill_sessions']['Insert']>
      }
      speaking_sessions: {
        Row: {
          id: string
          user_id: string
          mode: 'read_aloud' | 'shadowing' | 'pronunciation'
          accuracy_score: number | null
          source_text: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['speaking_sessions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['speaking_sessions']['Insert']>
      }
      phrase_bank: {
        Row: {
          id: string
          user_id: string
          phrase: string
          context: string | null
          source: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['phrase_bank']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['phrase_bank']['Insert']>
      }
    }
  }
}
