import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const houses = await prisma.house.findMany({
      include: {
        _count: {
          select: { members: true, rallies: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(houses)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch houses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, covetName, ownerName } = body
    if (!name || !covetName || !ownerName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const house = await prisma.house.create({
      data: { name, covetName, ownerName }
    })
    return NextResponse.json(house, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create house' }, { status: 500 })
  }
}
