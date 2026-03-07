import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function monthNumberToName(month: number) {
  return MONTH_NAMES[Math.max(1, Math.min(12, month)) - 1]
}

function getMemberRole(directivos: Array<{ role: string; end_date: Date | null }>) {
  const active = directivos.find((item) => !item.end_date)
  return active?.role ?? 'member'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const houseId = searchParams.get('house_id')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const excludeRoles = searchParams.get('excludeRoles')?.split(',') || []

    if (!houseId || !month || !year) {
      return NextResponse.json({ error: 'Missing required params' }, { status: 400 })
    }

    const targetHouse = await prisma.houses.findUnique({
      where: { id: parseInt(houseId) },
      select: { id: true, brand_id: true }
    })

    if (!targetHouse || !targetHouse.brand_id) {
      return NextResponse.json([])
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
              include: {
                members: {
                  include: {
                    directivos: true
                  }
                }
              }
            }
          }
        }
      }
    })

    const memberScores: Record<
      number,
      {
        member: { role: string; house_id: number | null; cuenta: string; nombre: string; member_id: number }
        total: number
      }
    > = {}

    for (const rally of rallies) {
      for (const show of rally.shows) {
        for (const participation of show.participations) {
          if (!participation.members) continue

          const role = getMemberRole(participation.members.directivos)
          if (excludeRoles.includes(role)) continue
          if (participation.members.house_id !== parseInt(houseId)) continue

          if (!memberScores[participation.members.id]) {
            memberScores[participation.members.id] = {
              member: {
                role,
                house_id: participation.members.house_id,
                cuenta: participation.members.cuenta,
                nombre: participation.members.nombre,
                member_id: participation.members.id
              },
              total: 0
            }
          }

          memberScores[participation.members.id].total += participation.points ?? 0
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
