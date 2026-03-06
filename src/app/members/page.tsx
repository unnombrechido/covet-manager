'use client'

import { useState, useEffect } from 'react'

interface Member {
  id: number
  numericCode: number
  covetName: string
  ownerName: string
  role: string
  activeFrom: string
  activeTo: string | null
  houseId: number
  house: { id: number; name: string; covetName: string }
}

interface House {
  id: number
  name: string
  covetName: string
}

const ROLES = ['owner', 'manager', 'member']
const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-yellow-100 text-yellow-800',
  manager: 'bg-blue-100 text-blue-800',
  member: 'bg-gray-100 text-gray-800'
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [houses, setHouses] = useState<House[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showTransfer, setShowTransfer] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [filterHouse, setFilterHouse] = useState('')
  const [filterActive, setFilterActive] = useState(true)
  const [formData, setFormData] = useState({
    numericCode: '',
    covetName: '',
    ownerName: '',
    role: 'member',
    houseId: '',
    activeFrom: new Date().toISOString().split('T')[0]
  })
  const [transferHouseId, setTransferHouseId] = useState('')

  const fetchData = async () => {
    try {
      const params = new URLSearchParams()
      if (filterHouse) params.set('houseId', filterHouse)
      if (filterActive) params.set('activeOnly', 'true')
      const [membersRes, housesRes] = await Promise.all([
        fetch(`/api/members?${params}`),
        fetch('/api/houses')
      ])
      setMembers(await membersRes.json())
      setHouses(await housesRes.json())
    } catch {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [filterHouse, filterActive])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Failed to create member')
        return
      }
      setFormData({ numericCode: '', covetName: '', ownerName: '', role: 'member', houseId: '', activeFrom: new Date().toISOString().split('T')[0] })
      setShowForm(false)
      fetchData()
    } catch {
      setError('Failed to create member')
    }
  }

  const deactivateMember = async (id: number) => {
    if (!confirm('Remove this member (set deactivation date to today)?')) return
    try {
      await fetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeTo: new Date().toISOString() })
      })
      fetchData()
    } catch {
      setError('Failed to deactivate member')
    }
  }

  const transferMember = async (id: number) => {
    if (!transferHouseId) return
    try {
      await fetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ houseId: parseInt(transferHouseId) })
      })
      setShowTransfer(null)
      setTransferHouseId('')
      fetchData()
    } catch {
      setError('Failed to transfer member')
    }
  }

  const suggestNumericCode = () => {
    if (members.length === 0) return '1001'
    const maxCode = Math.max(...members.map(m => m.numericCode))
    return String(maxCode + 1)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-500 text-lg animate-pulse">Loading members...</div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">👑 Members</h1>
        <button
          onClick={() => {
            setShowForm(!showForm)
            if (!showForm) setFormData(prev => ({ ...prev, numericCode: suggestNumericCode() }))
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Member'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow mb-6 border border-gray-200 dark:border-gray-700 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by House</label>
          <select
            value={filterHouse}
            onChange={(e) => setFilterHouse(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
          >
            <option value="">All Houses</option>
            {houses.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filterActive}
              onChange={(e) => setFilterActive(e.target.checked)}
              className="w-4 h-4 text-purple-600"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active members only</span>
          </label>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Add New Member</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Numeric Code</label>
              <input
                type="number"
                required
                value={formData.numericCode}
                onChange={(e) => setFormData({ ...formData, numericCode: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
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
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">House</label>
              <select
                required
                value={formData.houseId}
                onChange={(e) => setFormData({ ...formData, houseId: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value="">Select a house</option>
                {houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Active From</label>
              <input
                type="date"
                required
                value={formData.activeFrom}
                onChange={(e) => setFormData({ ...formData, activeFrom: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>
          <button type="submit" className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Add Member
          </button>
        </form>
      )}

      {members.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-5xl mb-4">👑</div>
          <p className="text-lg">No members found.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Member</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">House</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-300">#{member.numericCode}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{member.covetName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{member.ownerName}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[member.role] || ROLE_COLORS.member}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{member.house.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${member.activeTo ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {member.activeTo ? 'Inactive' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {!member.activeTo && (
                        <>
                          <button
                            onClick={() => setShowTransfer(showTransfer === member.id ? null : member.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium"
                          >
                            Transfer
                          </button>
                          <button
                            onClick={() => deactivateMember(member.id)}
                            className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 font-medium"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                    {showTransfer === member.id && (
                      <div className="mt-2 flex items-center gap-2">
                        <select
                          value={transferHouseId}
                          onChange={(e) => setTransferHouseId(e.target.value)}
                          className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Select house</option>
                          {houses.filter(h => h.id !== member.houseId).map(h => (
                            <option key={h.id} value={h.id}>{h.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => transferMember(member.id)}
                          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                        >
                          Move
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
