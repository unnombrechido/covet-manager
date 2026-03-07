import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function monthNumberToName(month: number) {
  return MONTH_NAMES[Math.max(1, Math.min(12, month)) - 1]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const houseId = searchParams.get('house_id')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    if (!houseId || !month || !year) {
      return NextResponse.json({ error: 'Missing required params' }, { status: 400 })
    }

    const targetHouse = await prisma.houses.findUnique({
      where: { id: parseInt(houseId) },
      select: { id: true, brand_id: true }
    })

    if (!targetHouse || !targetHouse.brand_id) {
      return NextResponse.json({
        total_shows: 0,
        total_participants: 0,
        top_scorer: null,
        show_breakdown: [],
        rallies: []
      })
    }

    const parsedYear = parseInt(year)
    const startOfYear = new Date(parsedYear, 0, 1)
    const startOfNextYear = new Date(parsedYear + 1, 0, 1)

    const rallies = await prisma.rallies.findMany({
      where: {
        brand_id: targetHouse.brand_id,
        month: monthNumberToName(parseInt(month)),
        created_at: {
          gte: startOfYear,
          lt: startOfNextYear
        }
      },
      include: {
        shows: {
          include: {
            participations: {
              include: { members: true }
            }
          }
        }
      }
    })

    const totalShows = rallies.reduce((sum, r) => sum + r.shows.length, 0)
    const allScores = rallies.flatMap((r) => r.shows.flatMap((s) => s.participations))
    const participatedScores = allScores.filter((s) => (s.points ?? 0) > 0 && s.members?.house_id === parseInt(houseId))
    const totalParticipants = new Set(participatedScores.map((s) => s.member_id)).size

    const memberTotals: Record<number, { member: { cuenta: string; nombre: string }; total: number }> = {}
    for (const score of allScores) {
      if (!score.members || score.members.house_id !== parseInt(houseId)) continue

      if (!memberTotals[score.members.id]) {
        memberTotals[score.members.id] = {
          member: {
            cuenta: score.members.cuenta,
            nombre: score.members.nombre
          },
          total: 0
        }
      }

      memberTotals[score.members.id].total += score.points ?? 0
    }

    const topScorer = Object.values(memberTotals).sort((a, b) => b.total - a.total)[0] || null

    const showBreakdown = rallies.flatMap(r =>
      r.shows.map(show => ({
        show_id: show.id,
        show_name: show.name,
        show_code: `S${String(show.show_number).padStart(2, '0')}`,
        show_type: 'regular',
        rally_name: r.slot_ini || `Rally ${r.rally_number}`,
        total_score: show.participations
          .filter((s) => s.members?.house_id === parseInt(houseId))
          .reduce((sum, s) => sum + (s.points ?? 0), 0),
        participant_count: show.participations
          .filter((s) => s.members?.house_id === parseInt(houseId) && (s.points ?? 0) > 0)
          .length
      }))
    )

    return NextResponse.json({
      total_shows: totalShows,
      total_participants: totalParticipants,
      top_scorer: topScorer,
      show_breakdown: showBreakdown,
      rallies: rallies.map((r) => ({ id: r.id, name: r.slot_ini || `Rally ${r.rally_number}`, show_count: r.shows.length }))
    })
  } catch {
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
