import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL  as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Without generic — supabase-js v2.107 requires exact Supabase-generated types.
// We use our own database.types.ts for store-level typing instead.
export const supabase = createClient(url, key)
