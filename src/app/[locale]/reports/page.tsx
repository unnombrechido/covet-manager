'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

interface House {
  id: number
  name: string
}

interface ReportData {
  total_shows: number
  total_participants: number
  top_scorer: { member: { cuenta: string; nombre: string }; total: number } | null
  show_breakdown: {
    show_id: number
    show_name: string
    show_code: string
    show_type: string
    rally_name: string
    total_score: number
    participant_count: number
  }[]
  rallies: { id: number; name: string; show_count: number }[]
}

export default function ReportsPage() {
  const t = useTranslations('reports')
  const tc = useTranslations('common')
  const tMonths = useTranslations('months')
  const tTypes = useTranslations('showTypes')

  const [houses, setHouses] = useState<House[]>([])
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    house_id: '',
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear())
  })

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: tMonths(String(i + 1) as '1'),
  }))

  useEffect(() => {
    fetch('/api/houses').then(r => r.json()).then(setHouses).catch(() => setError(t('loadError')))
  }, [])

  const generateReport = async () => {
    if (!filters.house_id) {
      setError(t('fillHouse'))
      return
    }
    setError('')
    setLoading(true)
    try {
      const params = new URLSearchParams(filters)
      const res = await fetch(`/api/reports?${params}`)
      setReport(await res.json())
    } catch {
      setError(t('fetchError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📊 {t('title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
        </div>
        <button
          onClick={generateReport}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {loading ? tc('generating') : t('generateReport')}
        </button>
      </div>

      {report && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {tMonths(filters.month as '1')} {filters.year} {t('report')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">{report.total_shows}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{t('totalShows')}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">{report.total_participants}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{t('uniqueParticipants')}</div>
            </div>
            {report.top_scorer && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-5 shadow border border-yellow-300 dark:border-yellow-700 text-center">
                <div className="text-lg font-bold text-yellow-700 dark:text-yellow-400 mb-1">
                  🏆 {report.top_scorer.member.cuenta}
                </div>
                <div className="text-sm text-yellow-600 dark:text-yellow-500">{report.top_scorer.total.toFixed(0)} {tc('points')}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('topScorer')}</div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('ralliesThisMonth')}</h3>
            {report.rallies.length === 0 ? (
              <p className="text-gray-500">{t('noRallies')}</p>
            ) : (
              <div className="space-y-2">
                {report.rallies.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{r.name}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{r.show_count} {tc('shows')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('showBreakdown')}</h3>
            </div>
            {report.show_breakdown.length === 0 ? (
              <div className="p-5 text-gray-500">{t('noShows')}</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('show')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('rally')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('type')}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('participantsCol')}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('totalScore')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {report.show_breakdown.map(show => (
                    <tr key={show.show_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{show.show_name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{show.show_code}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{show.rally_name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full text-xs">
                          {tTypes(show.show_type as 'regular')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 text-right">{show.participant_count}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-purple-600 dark:text-purple-400 text-right">{show.total_score.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
