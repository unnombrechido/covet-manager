'use client'

import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'

type RequireAuthProps = {
  locale: string
  children: React.ReactNode
}

export default function RequireAuth({ locale, children }: RequireAuthProps) {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [clientReady, setClientReady] = useState(true)
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      setClientReady(false)
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null)
      setLoading(false)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null)
      setLoading(false)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const signInWithFacebook = async () => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      setLoginError('Supabase client is not configured.')
      return
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/${locale}`
      }
    })

    if (error) {
      setLoginError(error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Loading authentication...
      </div>
    )
  }

  if (!clientReady) {
    return (
      <div className="max-w-lg mx-auto mt-24 p-6 rounded-xl border border-red-300 bg-red-50 text-red-800">
        Supabase is not configured. Set `NEXT_PUBLIC_SUPABASE_URL` and either `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`.
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-purple-200 bg-white shadow-lg p-8 text-center">
          <div className="text-4xl mb-3">LOCK</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h1>
          <p className="text-gray-600 mb-6">Please sign in with Facebook to access Covet Manager.</p>
          {loginError && (
            <div className="mb-4 text-left text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
              {loginError}
            </div>
          )}
          <button
            type="button"
            onClick={signInWithFacebook}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg"
          >
            Continue with Facebook
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
