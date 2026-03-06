import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const houseId = searchParams.get('houseId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    if (!houseId || !month || !year) {
      return NextResponse.json({ error: 'Missing required params' }, { status: 400 })
    }

    const rallies = await prisma.rally.findMany({
      where: {
        houseId: parseInt(houseId),
        month: parseInt(month),
        year: parseInt(year)
      },
      include: {
        shows: {
          include: {
            scores: {
              include: { member: true }
            }
          }
        }
      }
    })

    const totalShows = rallies.reduce((sum, r) => sum + r.shows.length, 0)
    const allScores = rallies.flatMap(r => r.shows.flatMap(s => s.scores))
    const participatedScores = allScores.filter(s => s.score > 0)
    const totalParticipants = new Set(participatedScores.map(s => s.memberId)).size

    const memberTotals: Record<number, { member: { covetName: string; ownerName: string }; total: number }> = {}
    for (const score of allScores) {
      if (!memberTotals[score.memberId]) {
        memberTotals[score.memberId] = { member: score.member, total: 0 }
      }
      memberTotals[score.memberId].total += score.score
    }

    const topScorer = Object.values(memberTotals).sort((a, b) => b.total - a.total)[0] || null

    const showBreakdown = rallies.flatMap(r =>
      r.shows.map(show => ({
        showId: show.id,
        showName: show.name,
        showCode: show.code,
        showType: show.showType,
        rallyName: r.name,
        totalScore: show.scores.reduce((sum, s) => sum + s.score, 0),
        participantCount: show.scores.filter(s => s.score > 0).length
      }))
    )

    return NextResponse.json({
      totalShows,
      totalParticipants,
      topScorer,
      showBreakdown,
      rallies: rallies.map(r => ({ id: r.id, name: r.name, showCount: r.shows.length }))
    })
  } catch {
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
