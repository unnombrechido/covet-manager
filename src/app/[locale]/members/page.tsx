'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { getSupabaseClient } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'

interface Member {
  id: number
  cuenta: string
  nombre: string
  role: string
  fecha_ingreso: string
  fecha_salida: string | null
  user_id?: string | null
  house_id: number
  houses: { id: number; name: string } | null
}

interface House {
  id: number
  name: string
}

const ROLES = ['owner', 'manager', 'member'] as const
const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-yellow-100 text-yellow-800',
  manager: 'bg-blue-100 text-blue-800',
  member: 'bg-gray-100 text-gray-800'
}

export default function MembersPage() {
  const t = useTranslations('members')
  const tc = useTranslations('common')

  const [members, setMembers] = useState<Member[]>([])
  const [houses, setHouses] = useState<House[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [show_transfer, set_show_transfer] = useState<number | null>(null)
  const [error, set_error] = useState('')
  const [current_user_id, set_current_user_id] = useState<string | null>(null)
  const [filter_house, set_filter_house] = useState('')
  const [filter_active, set_filter_active] = useState(true)
  const [form_data, set_form_data] = useState({
    cuenta: '',
    nombre: '',
    role: 'member',
    house_id: '',
    fecha_ingreso: new Date().toISOString().split('T')[0]
  })
  const [transfer_house_id, set_transfer_house_id] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filter_house) params.set('house_id', filter_house)
      if (filter_active) params.set('active_only', 'true')
      const [membersRes, housesRes] = await Promise.all([
        authFetch(`/api/members?${params}`),
        authFetch('/api/houses')
      ])
      setMembers(await membersRes.json())
      setHouses(await housesRes.json())
    } catch {
      set_error(t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [filter_house, filter_active])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    let mounted = true

    const loadCurrentUser = async () => {
      const supabase = getSupabaseClient()
      if (!supabase) return
      const { data } = await supabase.auth.getSession()
      if (mounted) {
        set_current_user_id(data.session?.user.id ?? null)
      }
    }

    loadCurrentUser()
    return () => {
      mounted = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    set_error('')
    try {
      const res = await authFetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form_data)
      })
      if (!res.ok) {
        const d = await res.json()
        set_error(d.error || t('createError'))
        return
      }
      set_form_data({ cuenta: '', nombre: '', role: 'member', house_id: '', fecha_ingreso: new Date().toISOString().split('T')[0] })
      setShowForm(false)
      fetchData()
    } catch {
      set_error(t('createError'))
    }
  }

  const deactivateMember = async (id: number) => {
    if (!confirm(t('removeConfirm'))) return
    try {
      await authFetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha_salida: new Date().toISOString() })
      })
      fetchData()
    } catch {
      set_error(t('updateError'))
    }
  }

  const linkMemberToCurrentUser = async (id: number) => {
    set_error('')
    try {
      const res = await authFetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkCurrentUser: true })
      })

      if (!res.ok) {
        const data = await res.json()
        set_error(data.error || t('updateError'))
        return
      }

      fetchData()
    } catch {
      set_error(t('updateError'))
    }
  }

  const transferMember = async (id: number) => {
    if (!transfer_house_id) return
    try {
      await authFetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ house_id: parseInt(transfer_house_id) })
      })
      set_show_transfer(null)
      set_transfer_house_id('')
      fetchData()
    } catch {
      set_error(t('updateError'))
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">👑 {t('title')}</h1>
        <button
          onClick={() => {
            setShowForm(!showForm)
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {showForm ? tc('cancel') : `+ ${t('addMember')}`}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-lg px-4 py-3 mb-4 text-sm flex flex-wrap items-center gap-3">
        <span className="font-semibold">Authenticated UUID:</span>
        <code className="break-all">{current_user_id ?? 'No active session'}</code>
        {current_user_id && (
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(current_user_id)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium"
          >
            Copy UUID
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow mb-6 border border-gray-200 dark:border-gray-700 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('filterByHouse')}</label>
          <select
            value={filter_house}
            onChange={(e) => set_filter_house(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
          >
            <option value="">{t('allHouses')}</option>
            {houses.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filter_active}
              onChange={(e) => set_filter_active(e.target.checked)}
              className="w-4 h-4 text-purple-600"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('activeOnly')}</span>
          </label>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('addNewMember')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('covetName')}</label>
              <input
                type="text"
                required
                value={form_data.cuenta}
                onChange={(e) => set_form_data({ ...form_data, cuenta: e.target.value })}
                placeholder={t('covetNamePlaceholder')}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('ownerName')}</label>
              <input
                type="text"
                required
                value={form_data.nombre}
                onChange={(e) => set_form_data({ ...form_data, nombre: e.target.value })}
                placeholder={t('ownerNamePlaceholder')}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{tc('role')}</label>
              <select
                value={form_data.role}
                onChange={(e) => set_form_data({ ...form_data, role: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
              >
                {ROLES.map(r => <option key={r} value={r}>{t(`roles.${r}`)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{tc('house')}</label>
              <select
                required
                value={form_data.house_id}
                onChange={(e) => set_form_data({ ...form_data, house_id: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value="">{t('allHouses')}</option>
                {houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('activeFrom')}</label>
              <input
                type="date"
                required
                value={form_data.fecha_ingreso}
                onChange={(e) => set_form_data({ ...form_data, fecha_ingreso: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>
          <button type="submit" className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            {t('addMember')}
          </button>
        </form>
      )}

      {members.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-5xl mb-4">👑</div>
          <p className="text-lg">{t('noMembers')}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{tc('member')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{tc('role')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{tc('house')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Auth UUID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('activeFrom')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('actions.transfer')}/{t('actions.remove')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{member.cuenta}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{member.nombre}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[member.role] || ROLE_COLORS.member}`}>
                      {t(`roles.${member.role as 'owner' | 'manager' | 'member'}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{member.houses?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                    {member.user_id ? (
                      <code className="break-all">{member.user_id}</code>
                    ) : (
                      <span className="text-amber-600 font-medium">Not linked</span>
                    )}
                    {current_user_id && member.user_id !== current_user_id && !member.fecha_salida && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => linkMemberToCurrentUser(member.id)}
                          className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                        >
                          Link to my user
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {new Date(member.fecha_ingreso).toLocaleDateString()}
                    {member.fecha_salida && (
                      <span className="ml-1 text-xs text-red-500">→ {new Date(member.fecha_salida).toLocaleDateString()}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {!member.fecha_salida && (
                        <>
                          <button
                            onClick={() => set_show_transfer(show_transfer === member.id ? null : member.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium"
                          >
                            {t('actions.transfer')}
                          </button>
                          <button
                            onClick={() => deactivateMember(member.id)}
                            className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 font-medium"
                          >
                            {t('actions.remove')}
                          </button>
                        </>
                      )}
                    </div>
                    {show_transfer === member.id && (
                      <div className="mt-2 flex items-center gap-2">
                        <select
                          value={transfer_house_id}
                          onChange={(e) => set_transfer_house_id(e.target.value)}
                          className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">{t('transferTo')}</option>
                          {houses.filter(h => h.id !== member.house_id).map(h => (
                            <option key={h.id} value={h.id}>{h.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => transferMember(member.id)}
                          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                        >
                          {t('actions.transfer')}
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
