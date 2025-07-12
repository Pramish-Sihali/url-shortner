// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client for server-side operations (full access)
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey)

// Client for client-side operations (limited access)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Url {
  id: string
  original_url: string
  short_code: string
  custom_alias?: string
  title?: string
  click_count: number
  last_clicked?: string
  created_at: string
  updated_at: string
  expires_at?: string
  is_active: boolean
}

export interface Click {
  id: string
  url_id: string
  ip_address?: string
  user_agent?: string
  referer?: string
  country?: string
  city?: string
  device_type?: string
  browser?: string
  os?: string
  clicked_at: string
}

