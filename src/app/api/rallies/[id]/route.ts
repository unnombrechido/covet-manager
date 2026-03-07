import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth'
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export const dynamic = 'force-dynamic'

function monthNameToNumber(month: string) {
  const index = MONTH_NAMES.findIndex((item) => item.toLowerCase() === month.toLowerCase())
  return index >= 0 ? index + 1 : 1
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = parseInt(params.id)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid rally id' }, { status: 400 })
    }

    const rally = await prisma.rallies.findUnique({
      where: { id },
      include: {
        brands: {
          include: {
            houses: {
              select: { id: true, name: true }
            }
          }
        },
        shows: {
          include: {
            _count: { select: { participations: true } },
            participations: {
              include: {
                members: true
              }
            }
          }
        }
      }
    })
    if (!rally) return NextResponse.json({ error: 'Rally not found' }, { status: 404 })

    const house = rally.brands?.houses?.[0] ?? null
    const fallbackYear = rally.created_at ? new Date(rally.created_at).getFullYear() : new Date().getFullYear()
    const year = rally.slot_fin ? parseInt(rally.slot_fin) : fallbackYear

    return NextResponse.json({
      id: rally.id,
      name: rally.slot_ini || `Rally ${monthNameToNumber(rally.month)}/${year}`,
      month: monthNameToNumber(rally.month),
      year,
      house: house
        ? { id: house.id, name: house.name }
        : { id: 0, name: 'Unknown House' },
      shows: rally.shows.map((show) => {
        return {
          id: show.id,
          name: show.name,
          details: show.details,
          show_number: show.show_number,
          rallyId: rally.id,
          scores: show.participations.map((participation) => ({
            id: participation.id,
            memberId: participation.member_id,
            score: participation.points ?? 0,
            annotation: participation.notes,
            member: participation.members
              ? {
                  id: participation.members.id,
                  covetName: participation.members.cuenta
                }
              : null
          })),
          _count: { scores: show._count.participations }
        }
      })
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch rally' }, { status: 500 })
  }
}
