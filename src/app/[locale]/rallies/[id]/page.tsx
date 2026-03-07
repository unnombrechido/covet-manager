'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { authFetch } from '@/lib/auth-fetch'

interface Show {
  id: number
  name: string
  details: string | null
  show_number: number
  rally_id: number
  scores: { score: number; member: { cuenta: string } }[]
  _count: { scores: number }
}

interface Rally {
  id: number
  name: string
  month: number
  year: number
  house: { id: number; name: string }
  shows: Show[]
}

export default function RallyDetailPage() {
  const t = useTranslations('rallies')
  const tc = useTranslations('common')
  const tMonths = useTranslations('months')
  const locale = useLocale()
  const params = useParams()
  const rally_id = params.id as string

  const [rally, setRally] = useState<Rally | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({ name: '', details: '' })

  const fetchRally = useCallback(async () => {
    try {
      const res = await authFetch(`/api/rallies/${rally_id}`)
      if (!res.ok) throw new Error()
      setRally(await res.json())
    } catch {
      setError(t('loadRallyError'))
    } finally {
      setLoading(false)
    }
  }, [rally_id])

  useEffect(() => { fetchRally() }, [fetchRally])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await authFetch(`/api/rallies/${rally_id}/shows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || t('addShowError'))
        return
      }
      setFormData({ name: '', details: '' })
      setShowForm(false)
      fetchRally()
    } catch {
      setError(t('addShowError'))
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-500 text-lg animate-pulse">{tc('loading')}</div>
    </div>
  )

  if (!rally) return (
    <div className="text-center py-16 text-red-500">
      <p>{t('rallyNotFound')}</p>
      <Link href={`/${locale}/rallies`} className="text-purple-600 hover:underline mt-2 inline-block">
        {t('backToRallies')}
      </Link>
    </div>
  )

  const filteredShows = rally.shows.filter((show) =>
    show.name.toLowerCase().includes(search.toLowerCase()) ||
    (show.details ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const totalScore = rally.shows.reduce((sum, show) =>
    sum + show.scores.reduce((s2, sc) => s2 + sc.score, 0), 0)

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Link href={`/${locale}/rallies`} className="text-purple-600 hover:text-purple-800 dark:text-purple-400 text-sm">
          {t('backToRallies')}
        </Link>
      </div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{rally.name}</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {tMonths(String(rally.month) as '1')} {rally.year} · 🏠 {rally.house.name}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {showForm ? tc('cancel') : `+ ${t('addShow')}`}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-2xl font-bold text-purple-600">{rally.shows.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('totalShows')}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-2xl font-bold text-purple-600">{rally.shows.reduce((sum, s) => sum + s._count.scores, 0)}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('scoreEntries')}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-2xl font-bold text-purple-600">{totalScore.toFixed(0)}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('totalScore')}</div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('addShowTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('showName')}</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder={t('showNamePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Details</label>
              <input
                type="text"
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="Optional"
              />
            </div>
          </div>
          <button type="submit" className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            {t('addShowBtn')}
          </button>
        </form>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder={t('searchShows')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
        />
      </div>

      {filteredShows.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-lg">{rally.shows.length === 0 ? t('noShows') : t('noShowsMatch')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredShows.map(show => {
            const showTotal = show.scores.reduce((sum, s) => sum + s.score, 0)
            const participants = show.scores.filter(s => s.score > 0).length
            return (
              <Link
                key={show.id}
                href={`/${locale}/rallies/${rally_id}/shows/${show.id}`}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow border border-gray-200 dark:border-gray-700 hover:border-purple-400 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                      {show.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">#{show.show_number} {show.details ? `· ${show.details}` : ''}</p>
                  </div>
                </div>
                <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>👥 {participants} {t('participants')}</span>
                  <span>🎯 {showTotal.toFixed(0)} {t('ptsTotal')}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
