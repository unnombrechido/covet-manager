import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function getMemberRole(directivos: Array<{ role: string; end_date: Date | null }>) {
  const active = directivos.find((item) => !item.end_date)
  return active?.role ?? 'member'
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = parseInt(params.id)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid house id' }, { status: 400 })
    }

    const body = await request.json()

    const existing = await prisma.houses.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    const house = await prisma.houses.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        description: body.description ?? existing.description
      }
    })

    return NextResponse.json(house)
  } catch {
    return NextResponse.json({ error: 'Failed to update house' }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = parseInt(params.id)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid house id' }, { status: 400 })
    }

    const house = await prisma.houses.findUnique({
      where: { id },
      include: {
        members: { include: { directivos: true } }
      }
    })
    if (!house) return NextResponse.json({ error: 'House not found' }, { status: 404 })

    const rallies = house.brand_id
      ? await prisma.rallies.findMany({ where: { brand_id: house.brand_id } })
      : []

    return NextResponse.json({
      ...house,
      members: house.members.map((member) => ({
        ...member,
        role: getMemberRole(member.directivos)
      })),
      rallies
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch house' }, { status: 500 })
  }
}
