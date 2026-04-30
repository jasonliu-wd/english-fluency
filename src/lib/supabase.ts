import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Untyped client — component-level types in src/types/database.ts keep full safety
// without fighting supabase-js generic schema version requirements
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
