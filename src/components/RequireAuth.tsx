'use client'

import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'

type RequireAuthProps = {
  children: React.ReactNode
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [clientReady, setClientReady] = useState(true)
  const [loginError, setLoginError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [authLoading, setAuthLoading] = useState(false)
  const [authMessage, setAuthMessage] = useState('')

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

  const handleEmailAuth = async () => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      setLoginError('Supabase client is not configured.')
      return
    }

    if (!email || !password) {
      setLoginError('Email and password are required.')
      return
    }

    setAuthLoading(true)
    setLoginError('')
    setAuthMessage('')

    const emailRedirectTo = `${window.location.origin}${window.location.pathname}`

    const result = authMode === 'signin'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo }
      })

    if (result.error) {
      setLoginError(result.error.message)
      setAuthLoading(false)
      return
    }

    if (authMode === 'signup') {
      setAuthMessage('Sign-up successful. If email confirmation is enabled, please confirm your email before signing in.')
    }

    setAuthLoading(false)
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
        Supabase is not configured. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`.
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-purple-200 bg-white shadow-lg p-8 text-center">
          <div className="text-4xl mb-3">LOCK</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h1>
          <p className="text-gray-600 mb-6">Sign in with your email and password to access Covet Manager.</p>
          {loginError && (
            <div className="mb-4 text-left text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
              {loginError}
            </div>
          )}
          {authMessage && (
            <div className="mb-4 text-left text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
              {authMessage}
            </div>
          )}
          <div className="space-y-3 text-left mb-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Your password"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleEmailAuth}
            disabled={authLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 px-4 rounded-lg"
          >
            {authLoading ? 'Please wait...' : authMode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode((prev) => (prev === 'signin' ? 'signup' : 'signin'))
              setLoginError('')
              setAuthMessage('')
            }}
            className="mt-3 text-sm text-blue-700 hover:text-blue-800"
          >
            {authMode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
