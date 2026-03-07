'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { authFetch } from '@/lib/auth-fetch'

interface Rally {
  id: number
  name: string
  month: number
  year: number
  house_id: number
  house: { id: number; name: string }
  _count: { shows: number }
  createdAt: string
}

interface House {
  id: number
  name: string
}

export default function RalliesPage() {
  const t = useTranslations('rallies')
  const tc = useTranslations('common')
  const tMonths = useTranslations('months')
  const locale = useLocale()

  const [rallies, setRallies] = useState<Rally[]>([])
  const [houses, setHouses] = useState<House[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [filterHouse, setFilterHouse] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    house_id: ''
  })

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: tMonths(String(i + 1) as '1'),
  }))

  const fetchData = useCallback(async () => {
    try {
      const params = filterHouse ? `?house_id=${filterHouse}` : ''
      const [ralliesRes, housesRes] = await Promise.all([
        authFetch(`/api/rallies${params}`),
        authFetch('/api/houses')
      ])
      setRallies(await ralliesRes.json())
      setHouses(await housesRes.json())
    } catch {
      setError(t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [filterHouse])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await authFetch('/api/rallies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || t('createError'))
        return
      }
      setFormData({ name: '', month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()), house_id: '' })
      setShowForm(false)
      fetchData()
    } catch {
      setError(t('createError'))
    }
  }

  const grouped: Record<string, Rally[]> = {}
  rallies.forEach(r => {
    const key = `${r.year}-${String(r.month).padStart(2, '0')}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(r)
  })
  const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-500 text-lg animate-pulse">{tc('loading')}</div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🏆 {t('title')}</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {showForm ? tc('cancel') : `+ ${t('addRally')}`}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow mb-6 border border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{tc('filter')} {tc('house')}</label>
        <select
          value={filterHouse}
          onChange={(e) => setFilterHouse(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
        >
          <option value="">{tc('house')} ({tc('filter')})</option>
          {houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('createRally')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('rallyName')}</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder={t('rallyNamePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{tc('month')}</label>
              <select
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
              >
                {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{tc('year')}</label>
              <input
                type="number"
                required
                min="2020"
                max={String(new Date().getFullYear() + 5)}
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{tc('house')}</label>
              <select
                required
                value={formData.house_id}
                onChange={(e) => setFormData({ ...formData, house_id: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value="">{t('selectHouse')}</option>
                {houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            {t('createRally')}
          </button>
        </form>
      )}

      {sortedKeys.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-5xl mb-4">🏆</div>
          <p className="text-lg">{t('noRallies')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedKeys.map(key => {
            const [year, month] = key.split('-')
            const monthName = tMonths(String(parseInt(month)) as '1')
            return (
              <div key={key}>
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span className="text-2xl">📅</span>
                  {monthName} {year}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {grouped[key].map(rally => (
                    <Link
                      key={rally.id}
                      href={`/${locale}/rallies/${rally.id}`}
                      className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow border border-gray-200 dark:border-gray-700 hover:border-purple-400 hover:shadow-lg transition-all group"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 mb-2">
                        {rally.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        🏠 {rally.house.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        📋 {rally._count.shows} {tc('shows')}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
