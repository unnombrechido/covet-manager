import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const houseId = searchParams.get('houseId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const excludeRoles = searchParams.get('excludeRoles')?.split(',') || []

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
              include: {
                member: true
              }
            }
          }
        }
      }
    })

    const memberScores: Record<number, { member: { role: string; houseId: number; covetName: string; ownerName: string; numericCode: number }; total: number }> = {}

    for (const rally of rallies) {
      for (const show of rally.shows) {
        for (const score of show.scores) {
          if (excludeRoles.includes(score.member.role)) continue
          if (score.member.houseId !== parseInt(houseId)) continue
          if (!memberScores[score.memberId]) {
            memberScores[score.memberId] = { member: score.member, total: 0 }
          }
          memberScores[score.memberId].total += score.score
        }
      }
    }

    const rankings = Object.values(memberScores)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    return NextResponse.json(rankings)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch MVP data' }, { status: 500 })
  }
}
