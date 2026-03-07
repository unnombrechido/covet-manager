import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function serializeShow(show: {
  id: number
  rally_id: number | null
  show_number: number
  name: string
  details: string | null
  participations: {
    id: number
    member_id: number | null
    points: number | null
    notes: string | null
    members: { id: number; cuenta: string } | null
  }[]
  _count: { participations: number }
}) {
  return {
    id: show.id,
    name: show.name,
    details: show.details,
    show_number: show.show_number,
    rallyId: show.rally_id,
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
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const rallyId = parseInt(params.id)
    if (Number.isNaN(rallyId)) {
      return NextResponse.json({ error: 'Invalid rally id' }, { status: 400 })
    }

    const shows = await prisma.shows.findMany({
      where: { rally_id: rallyId },
      include: {
        _count: { select: { participations: true } },
        participations: {
          include: {
            members: true
          }
        }
      }
    })
    return NextResponse.json(shows.map(serializeShow))
  } catch {
    return NextResponse.json({ error: 'Failed to fetch shows' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const rallyId = parseInt(params.id)
    if (Number.isNaN(rallyId)) {
      return NextResponse.json({ error: 'Invalid rally id' }, { status: 400 })
    }

    const body = await request.json()
    const { name, details } = body
    if (!name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const lastShow = await prisma.shows.findFirst({
      where: { rally_id: rallyId },
      orderBy: { show_number: 'desc' }
    })

    const show = await prisma.shows.create({
      data: {
        rally_id: rallyId,
        show_number: (lastShow?.show_number ?? 0) + 1,
        name,
        details: details || null
      },
      include: {
        _count: { select: { participations: true } },
        participations: {
          include: {
            members: true
          }
        }
      }
    })

    return NextResponse.json(serializeShow(show), { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create show' }, { status: 500 })
  }
}
