'use client'

import { useState, useEffect } from 'react'

interface House {
  id: number
  name: string
  covetName: string
  ownerName: string
  isActive: boolean
  createdAt: string
  _count?: { members: number; rallies: number }
}

export default function HousesPage() {
  const [houses, setHouses] = useState<House[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({ name: '', covetName: '', ownerName: '' })

  const fetchHouses = async () => {
    try {
      const res = await fetch('/api/houses')
      const data = await res.json()
      setHouses(data)
    } catch {
      setError('Failed to load houses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHouses() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/houses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Failed to create house')
        return
      }
      setFormData({ name: '', covetName: '', ownerName: '' })
      setShowForm(false)
      fetchHouses()
    } catch {
      setError('Failed to create house')
    }
  }

  const toggleActive = async (house: House) => {
    try {
      await fetch(`/api/houses/${house.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !house.isActive })
      })
      fetchHouses()
    } catch {
      setError('Failed to update house')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-500 text-lg animate-pulse">Loading houses...</div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🏠 Houses</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add House'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Add New House</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">House Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="e.g., House of Stars"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Covet Name</label>
              <input
                type="text"
                required
                value={formData.covetName}
                onChange={(e) => setFormData({ ...formData, covetName: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="In-game house name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Owner Name</label>
              <input
                type="text"
                required
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="Owner's name"
              />
            </div>
          </div>
          <button type="submit" className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Create House
          </button>
        </form>
      )}

      {houses.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-5xl mb-4">🏠</div>
          <p className="text-lg">No houses yet. Add your first house!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {houses.map((house) => (
            <div key={house.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{house.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">@{house.covetName}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${house.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {house.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                <span className="font-medium">Owner:</span> {house.ownerName}
              </p>
              {house._count && (
                <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span>👥 {house._count.members} members</span>
                  <span>🏆 {house._count.rallies} rallies</span>
                </div>
              )}
              <button
                onClick={() => toggleActive(house)}
                className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  house.isActive
                    ? 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400'
                    : 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-400'
                }`}
              >
                {house.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
