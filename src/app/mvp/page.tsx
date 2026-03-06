'use client'

import { useState, useEffect } from 'react'

interface House {
  id: number
  name: string
  covetName: string
}

interface MVPEntry {
  member: {
    id: number
    covetName: string
    ownerName: string
    role: string
    numericCode: number
  }
  total: number
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MEDAL_COLORS = ['🥇', '🥈', '🥉']

export default function MVPPage() {
  const [houses, setHouses] = useState<House[]>([])
  const [rankings, setRankings] = useState<MVPEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    houseId: '',
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    excludeOwner: false,
    excludeManagers: false
  })

  useEffect(() => {
    fetch('/api/houses').then(r => r.json()).then(setHouses).catch(() => setError('Failed to load houses'))
  }, [])

  const fetchMVP = async () => {
    if (!filters.houseId || !filters.month || !filters.year) {
      setError('Please select a house, month, and year')
      return
    }
    setError('')
    setLoading(true)
    try {
      const excludeRoles = []
      if (filters.excludeOwner) excludeRoles.push('owner')
      if (filters.excludeManagers) excludeRoles.push('manager')
      const params = new URLSearchParams({
        houseId: filters.houseId,
        month: filters.month,
        year: filters.year,
        ...(excludeRoles.length > 0 ? { excludeRoles: excludeRoles.join(',') } : {})
      })
      const res = await fetch(`/api/mvp?${params}`)
      setRankings(await res.json())
    } catch {
      setError('Failed to load MVP data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">⭐ MVP Rankings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Top performers by total score for the month</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">House</label>
            <select
              value={filters.houseId}
              onChange={(e) => setFilters({ ...filters, houseId: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="">Select a house</option>
              {houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Month</label>
            <select
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
            >
              {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
            <input
              type="number"
              min="2020"
              max="2030"
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
          <div className="flex flex-col gap-2 justify-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filters.excludeOwner} onChange={(e) => setFilters({ ...filters, excludeOwner: e.target.checked })} className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Exclude Owner</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filters.excludeManagers} onChange={(e) => setFilters({ ...filters, excludeManagers: e.target.checked })} className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Exclude Managers</span>
            </label>
          </div>
        </div>
        <button
          onClick={fetchMVP}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {loading ? 'Loading...' : 'Get Rankings'}
        </button>
      </div>

      {rankings.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Top Performers — {MONTHS[parseInt(filters.month) - 1]} {filters.year}
          </h2>
          {rankings.map((entry, index) => (
            <div
              key={entry.member.id}
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
                    {entry.member.covetName}
                    {index === 0 && <span className="ml-2 text-sm font-medium bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full">⭐ MVP</span>}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {entry.member.ownerName} · #{entry.member.numericCode} · {entry.member.role}
                  </div>
                </div>
                <div className={`text-2xl font-bold ${index === 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-purple-600 dark:text-purple-400'}`}>
                  {entry.total.toFixed(0)}
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">pts</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {rankings.length === 0 && !loading && filters.houseId && (
        <div className="text-center py-16 text-gray-500">
          <div className="text-5xl mb-4">⭐</div>
          <p className="text-lg">No data found. Try adjusting your filters.</p>
        </div>
      )}
    </div>
  )
}
