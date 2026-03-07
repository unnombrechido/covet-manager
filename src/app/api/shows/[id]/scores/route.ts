import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function serializeScore(participation: {
  id: number
  show_id: number | null
  member_id: number | null
  points: number | null
  notes: string | null
  members: { id: number; cuenta: string; nombre: string } | null
}) {
  return {
    id: participation.id,
    show_id: participation.show_id,
    member_id: participation.member_id,
    score: participation.points ?? 0,
    annotation: participation.notes,
    member: participation.members
      ? {
          id: participation.members.id,
          cuenta: participation.members.cuenta,
          nombre: participation.members.nombre
        }
      : null
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const showId = parseInt(params.id)
    if (Number.isNaN(showId)) {
      return NextResponse.json({ error: 'Invalid show id' }, { status: 400 })
    }

    const participations = await prisma.participations.findMany({
      where: { show_id: showId },
      include: { members: true }
    })
    return NextResponse.json(participations.map(serializeScore))
  } catch {
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const showId = parseInt(params.id)
    if (Number.isNaN(showId)) {
      return NextResponse.json({ error: 'Invalid show id' }, { status: 400 })
    }

    const body = await request.json()
    const { member_id, score, annotation } = body

    const parsedMemberId = parseInt(member_id)
    const parsedScore = parseFloat(score) || 0

    const existing = await prisma.participations.findFirst({
      where: {
        show_id: showId,
        member_id: parsedMemberId
      }
    })

    const result = existing
      ? await prisma.participations.update({
          where: { id: existing.id },
          data: {
            points: parsedScore,
            notes: annotation || null,
            status: annotation ? 'annotated' : 'participated'
          },
          include: { members: true }
        })
      : await prisma.participations.create({
          data: {
            show_id: showId,
            member_id: parsedMemberId,
            points: parsedScore,
            notes: annotation || null,
            status: annotation ? 'annotated' : 'participated'
          },
          include: { members: true }
        })

    return NextResponse.json(serializeScore(result))
  } catch {
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 })
  }
}
