import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const showId = parseInt(params.id)
    const scores = await prisma.score.findMany({
      where: { showId },
      include: { member: true }
    })
    return NextResponse.json(scores)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const showId = parseInt(params.id)
    const body = await request.json()
    const { memberId, score, annotation } = body

    const result = await prisma.score.upsert({
      where: { showId_memberId: { showId, memberId: parseInt(memberId) } },
      update: { score: parseFloat(score) || 0, annotation: annotation || null },
      create: {
        showId,
        memberId: parseInt(memberId),
        score: parseFloat(score) || 0,
        annotation: annotation || null
      },
      include: { member: true }
    })
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 })
  }
}
