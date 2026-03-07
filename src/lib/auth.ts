import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const accessToken = authHeader.slice('Bearer '.length)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  if (!url || !publishableKey) return null

  const supabase = createClient(
    url,
    publishableKey
  )

  const { data, error } = await supabase.auth.getUser(accessToken)
  if (error || !data.user) return null

  return data.user.id
}
