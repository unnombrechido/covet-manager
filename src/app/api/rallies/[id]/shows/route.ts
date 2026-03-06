import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const rallyId = parseInt(params.id)
    const shows = await prisma.show.findMany({
      where: { rallyId },
      include: {
        _count: { select: { scores: true } },
        scores: { include: { member: true } }
      }
    })
    return NextResponse.json(shows)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch shows' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const rallyId = parseInt(params.id)
    const body = await request.json()
    const { name, code, showType } = body
    if (!name || !code || !showType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const show = await prisma.show.create({
      data: { name, code, showType, rallyId }
    })
    return NextResponse.json(show, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create show' }, { status: 500 })
  }
}
