import { createBrowserClient } from '@supabase/ssr'
import { getSupabasePublishableKey, getSupabaseUrl } from '@/src/lib/env'

export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabasePublishableKey())
}
