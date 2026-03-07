import { getSupabaseClient } from '@/lib/supabase'

export async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
  const supabase = getSupabaseClient()
  if (!supabase) {
    throw new Error('Supabase client is not configured')
  }

  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token

  if (!accessToken) {
    throw new Error('Unauthorized')
  }

  const headers = new Headers(init?.headers || {})
  headers.set('Authorization', `Bearer ${accessToken}`)

  return fetch(input, {
    ...init,
    headers
  })
}
