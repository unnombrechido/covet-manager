import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const accessToken = authHeader.slice('Bearer '.length)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase.auth.getUser(accessToken)
  if (error || !data.user) return null

  return data.user.id
}
