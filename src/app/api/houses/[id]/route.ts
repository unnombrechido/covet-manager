import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()
    const house = await prisma.house.update({
      where: { id },
      data: body
    })
    return NextResponse.json(house)
  } catch {
    return NextResponse.json({ error: 'Failed to update house' }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const house = await prisma.house.findUnique({
      where: { id },
      include: { members: true, rallies: true }
    })
    if (!house) return NextResponse.json({ error: 'House not found' }, { status: 404 })
    return NextResponse.json(house)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch house' }, { status: 500 })
  }
}
