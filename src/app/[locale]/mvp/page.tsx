'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

interface House {
  id: number
  name: string
}

interface MVPEntry {
  member: {
    member_id: number
    cuenta: string
    nombre: string
    role: string
    house_id: number | null
  }
  total: number
}

const MEDAL_COLORS = ['🥇', '🥈', '🥉']

export default function MVPPage() {
  const t = useTranslations('mvp')
  const tc = useTranslations('common')
  const tMonths = useTranslations('months')

  const [houses, setHouses] = useState<House[]>([])
  const [rankings, setRankings] = useState<MVPEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    house_id: '',
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    excludeOwner: false,
    excludeManagers: false
  })

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: tMonths(String(i + 1) as '1'),
  }))

  useEffect(() => {
    fetch('/api/houses').then(r => r.json()).then(setHouses).catch(() => setError(t('loadError')))
  }, [])

  const fetchMVP = async () => {
    if (!filters.house_id || !filters.month || !filters.year) {
      setError(t('fillFilters'))
      return
    }
    setError('')
    setLoading(true)
    try {
      const excludeRoles = []
      if (filters.excludeOwner) excludeRoles.push('owner')
      if (filters.excludeManagers) excludeRoles.push('manager')
      const params = new URLSearchParams({
        house_id: filters.house_id,
        month: filters.month,
        year: filters.year,
        ...(excludeRoles.length > 0 ? { excludeRoles: excludeRoles.join(',') } : {})
      })
      const res = await fetch(`/api/mvp?${params}`)
      setRankings(await res.json())
    } catch {
      setError(t('fetchError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">⭐ {t('title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{tc('house')}</label>
            <select
              value={filters.house_id}
              onChange={(e) => setFilters({ ...filters, house_id: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="">{t('selectHouse')}</option>
              {houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{tc('month')}</label>
            <select
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
            >
              {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{tc('year')}</label>
            <input
              type="number"
              min="2020"
              max={String(new Date().getFullYear() + 5)}
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
          <div className="flex flex-col gap-2 justify-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filters.excludeOwner} onChange={(e) => setFilters({ ...filters, excludeOwner: e.target.checked })} className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{t('excludeOwner')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filters.excludeManagers} onChange={(e) => setFilters({ ...filters, excludeManagers: e.target.checked })} className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{t('excludeManagers')}</span>
            </label>
          </div>
        </div>
        <button
          onClick={fetchMVP}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {loading ? tc('loading') : t('getRankings')}
        </button>
      </div>

      {rankings.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('topPerformers')} — {tMonths(filters.month as '1')} {filters.year}
          </h2>
          {rankings.map((entry, index) => (
            <div
              key={entry.member.member_id}
              className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow border transition-all ${
                index === 0
                  ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`text-3xl w-12 text-center font-bold ${index === 0 ? 'text-yellow-500' : 'text-gray-400'}`}>
                  {MEDAL_COLORS[index] || `#${index + 1}`}
                </div>
                <div className="flex-1">
                  <div className={`text-lg font-semibold ${index === 0 ? 'text-yellow-800 dark:text-yellow-300' : 'text-gray-900 dark:text-white'}`}>
                    {entry.member.cuenta}
                    {index === 0 && <span className="ml-2 text-sm font-medium bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full">{t('mvpBadge')}</span>}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {entry.member.nombre} · #{entry.member.member_id} · {entry.member.role}
                  </div>
                </div>
                <div className={`text-2xl font-bold ${index === 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-purple-600 dark:text-purple-400'}`}>
                  {entry.total.toFixed(0)}
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">{tc('points')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {rankings.length === 0 && !loading && filters.house_id && (
        <div className="text-center py-16 text-gray-500">
          <div className="text-5xl mb-4">⭐</div>
          <p className="text-lg">{t('noData')}</p>
        </div>
      )}
    </div>
  )
}
