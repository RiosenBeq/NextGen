import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_HESAPSUPABASE_URL!,
    process.env.NEXT_PUBLIC_HESAPSUPABASE_ANON_KEY!
  )
}
