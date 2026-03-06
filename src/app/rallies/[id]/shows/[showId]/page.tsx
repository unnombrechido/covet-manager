'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Member {
  id: number
  numericCode: number
  covetName: string
  ownerName: string
  role: string
}

interface Score {
  id: number
  memberId: number
  score: number
  annotation: string | null
  member: Member
}

interface Show {
  id: number
  name: string
  code: string
  showType: string
  rallyId: number
}

const ANNOTATIONS = [
  { value: '', label: 'Participated' },
  { value: "didn't participate", label: "Didn't Participate" },
  { value: 'temporarily banned', label: 'Temporarily Banned' },
  { value: 'other', label: 'Other' }
]

export default function ShowScorePage() {
  const params = useParams()
  const rallyId = params.id as string
  const showId = params.showId as string

  const [show, setShow] = useState<Show | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [scores, setScores] = useState<Record<number, { score: string; annotation: string }>>({})
  const [savedScores, setSavedScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const rallyRes = await fetch(`/api/rallies/${rallyId}`)
      const rallyData = await rallyRes.json()
      const currentShow = rallyData.shows.find((s: Show) => s.id === parseInt(showId))
      setShow(currentShow)

      const [membersRes, scoresRes] = await Promise.all([
        fetch(`/api/members?houseId=${rallyData.house.id}&activeOnly=true`),
        fetch(`/api/shows/${showId}/scores`)
      ])
      const membersData: Member[] = await membersRes.json()
      const scoresData: Score[] = await scoresRes.json()

      setMembers(membersData)
      setSavedScores(scoresData)

      const scoreMap: Record<number, { score: string; annotation: string }> = {}
      membersData.forEach(m => {
        const existingScore = scoresData.find(s => s.memberId === m.id)
        scoreMap[m.id] = {
          score: existingScore ? String(existingScore.score) : '',
          annotation: existingScore?.annotation || ''
        }
      })
      setScores(scoreMap)
    } catch {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [rallyId, showId])

  useEffect(() => { fetchData() }, [fetchData])

  const saveScore = async (memberId: number) => {
    setSaving(memberId)
    try {
      const scoreData = scores[memberId]
      await fetch(`/api/shows/${showId}/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          score: parseFloat(scoreData.score) || 0,
          annotation: scoreData.annotation || null
        })
      })
      await fetchData()
    } catch {
      setError('Failed to save score')
    } finally {
      setSaving(null)
    }
  }

  const handleScoreChange = (memberId: number, field: 'score' | 'annotation', value: string) => {
    setScores(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], [field]: value }
    }))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-500 text-lg animate-pulse">Loading show scores...</div>
    </div>
  )

  const totalScore = savedScores.reduce((sum, s) => sum + s.score, 0)
  const participantCount = savedScores.filter(s => s.score > 0).length

  return (
    <div>
      <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
        <Link href="/rallies" className="text-purple-600 hover:text-purple-800 dark:text-purple-400">Rallies</Link>
        <span>›</span>
        <Link href={`/rallies/${rallyId}`} className="text-purple-600 hover:text-purple-800 dark:text-purple-400">Rally #{rallyId}</Link>
        <span>›</span>
        <span>Score Entry</span>
      </div>

      {show && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{show.name}</h1>
            <p className="text-gray-500 dark:text-gray-400">Code: {show.code} · Type: {show.showType}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-2xl font-bold text-purple-600">{participantCount}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Participants</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-2xl font-bold text-purple-600">{totalScore.toFixed(0)}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Points</div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Member</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {members.map(member => {
              const memberScore = scores[member.id] || { score: '', annotation: '' }
              const isSaving = saving === member.id
              const savedScore = savedScores.find(s => s.memberId === member.id)
              return (
                <tr key={member.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  savedScore?.annotation === 'temporarily banned' ? 'bg-red-50 dark:bg-red-900/10' : ''
                }`}>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{member.covetName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">#{member.numericCode} · {member.role}</div>
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
                      {ANNOTATIONS.map(a => (
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
                      {isSaving ? 'Saving...' : 'Save'}
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
