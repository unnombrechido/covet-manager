'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { authFetch } from '@/lib/auth-fetch'

interface House {
  id: number
  name: string
  description: string | null
  created_at: string | null
  _count?: { members: number }
  rallies_count?: number
}

export default function HousesPage() {
  const t = useTranslations('houses')
  const tc = useTranslations('common')

  const [houses, setHouses] = useState<House[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({ name: '', description: '' })

  const fetchHouses = async () => {
    try {
      const res = await authFetch('/api/houses')
      const data = await res.json()
      setHouses(data)
    } catch {
      setError(t('loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHouses() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await authFetch('/api/houses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || t('createError'))
        return
      }
      setFormData({ name: '', description: '' })
      setShowForm(false)
      fetchHouses()
    } catch {
      setError(t('createError'))
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-500 text-lg animate-pulse">{tc('loading')}</div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🏠 {t('title')}</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {showForm ? tc('cancel') : `+ ${t('addHouse')}`}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('addNewHouse')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('houseName')}</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder={t('houseNamePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="Optional"
              />
            </div>
          </div>
          <button type="submit" className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            {t('createHouse')}
          </button>
        </form>
      )}

      {houses.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-5xl mb-4">🏠</div>
          <p className="text-lg">{t('noHouses')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {houses.map((house) => (
            <div key={house.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{house.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{house.description || '-'}</p>
                </div>
              </div>
              {house._count && (
                <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span>👥 {house._count.members} {tc('members')}</span>
                  <span>🏆 {house.rallies_count ?? 0} {tc('rallies')}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
