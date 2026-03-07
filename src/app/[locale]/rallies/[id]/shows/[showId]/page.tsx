'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'

interface Member {
  id: number
  cuenta: string
  nombre: string
  role: string
}

interface Score {
  id: number
  member_id: number
  score: number
  annotation: string | null
  member: Member
}

interface Show {
  id: number
  name: string
  details: string | null
  show_number: number
  rally_id: number
}

export default function ShowScorePage() {
  const t = useTranslations('scores')
  const tc = useTranslations('common')
  const locale = useLocale()
  const params = useParams()
  const rally_id = params.id as string
  const show_id = params.showId as string

  const [show, setShow] = useState<Show | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [scores, setScores] = useState<Record<number, { score: string; annotation: string }>>({})
  const [savedScores, setSavedScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [error, setError] = useState('')

  const annotations = [
    { value: '', label: t('annotations.participated') },
    { value: "didn't participate", label: t('annotations.didntParticipate') },
    { value: 'temporarily banned', label: t('annotations.temporarilyBanned') },
    { value: 'other', label: t('annotations.other') },
  ]

  const fetchData = useCallback(async () => {
    try {
      const rally_res = await fetch(`/api/rallies/${rally_id}`)
      const rally_data = await rally_res.json()
      const current_show = rally_data.shows.find((show: Show) => show.id === parseInt(show_id))
      setShow(current_show)

      const [members_res, scores_res] = await Promise.all([
        fetch(`/api/members?house_id=${rally_data.house.id}&active_only=true`),
        fetch(`/api/shows/${show_id}/scores`)
      ])
      const members_data: Member[] = await members_res.json()
      const scores_data: Score[] = await scores_res.json()

      setMembers(members_data)
      setSavedScores(scores_data)

      const score_map: Record<number, { score: string; annotation: string }> = {}
      members_data.forEach((member) => {
        const existing_score = scores_data.find((score) => score.member_id === member.id)
        score_map[member.id] = {
          score: existing_score ? String(existing_score.score) : '',
          annotation: existing_score?.annotation || ''
        }
      })
      setScores(score_map)
    } catch {
      setError(t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [rally_id, show_id])

  useEffect(() => { fetchData() }, [fetchData])

  const saveScore = async (member_id: number) => {
    setSaving(member_id)
    try {
      const score_data = scores[member_id]
      await fetch(`/api/shows/${show_id}/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id,
          score: parseFloat(score_data.score) || 0,
          annotation: score_data.annotation || null
        })
      })
      await fetchData()
    } catch {
      setError(t('saveError'))
    } finally {
      setSaving(null)
    }
  }

  const handleScoreChange = (member_id: number, field: 'score' | 'annotation', value: string) => {
    setScores((prev) => ({
      ...prev,
      [member_id]: { ...prev[member_id], [field]: value }
    }))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-500 text-lg animate-pulse">{tc('loading')}</div>
    </div>
  )

  const totalScore = savedScores.reduce((sum, s) => sum + s.score, 0)
  const participantCount = savedScores.filter(s => s.score > 0).length

  return (
    <div>
      <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
        <Link href={`/${locale}/rallies`} className="text-purple-600 hover:text-purple-800 dark:text-purple-400">
          {t('breadcrumbRallies')}
        </Link>
        <span>›</span>
        <Link href={`/${locale}/rallies/${rally_id}`} className="text-purple-600 hover:text-purple-800 dark:text-purple-400">
          Rally #{rally_id}
        </Link>
        <span>›</span>
        <span>{t('breadcrumbScoreEntry')}</span>
      </div>

      {show && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{show.name}</h1>
            <p className="text-gray-500 dark:text-gray-400">
              #{show.show_number}{show.details ? ` · ${show.details}` : ''}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-2xl font-bold text-purple-600">{participantCount}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('participants')}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-2xl font-bold text-purple-600">{totalScore.toFixed(0)}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('totalPoints')}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('member')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('score')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('status')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {members.map(member => {
              const memberScore = scores[member.id] || { score: '', annotation: '' }
              const isSaving = saving === member.id
              const savedScore = savedScores.find((score) => score.member_id === member.id)
              return (
                <tr key={member.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  savedScore?.annotation === 'temporarily banned' ? 'bg-red-50 dark:bg-red-900/10' : ''
                }`}>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{member.cuenta}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">#{member.id} · {member.role}</div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={memberScore.score}
                      onChange={(e) => handleScoreChange(member.id, 'score', e.target.value)}
                      className="w-24 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={memberScore.annotation}
                      onChange={(e) => handleScoreChange(member.id, 'annotation', e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      {annotations.map(a => (
                        <option key={a.value} value={a.value}>{a.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => saveScore(member.id)}
                      disabled={isSaving}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      {isSaving ? tc('saving') : tc('save')}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
