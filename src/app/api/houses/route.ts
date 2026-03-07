import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const houses = await prisma.houses.findMany({
      include: {
        _count: {
          select: { members: true }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    const rallyCounts = await Promise.all(
      houses.map((house) =>
        house.brand_id
          ? prisma.rallies.count({ where: { brand_id: house.brand_id } })
          : Promise.resolve(0)
      )
    )

    return NextResponse.json(
      houses.map((house, index) => ({
        ...house,
        rallies_count: rallyCounts[index]
      }))
    )
  } catch {
    return NextResponse.json({ error: 'Failed to fetch houses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body
    if (!name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const brand = await prisma.brands.create({
      data: { name: `${name} Brand` }
    })

    const house = await prisma.houses.create({
      data: {
        name,
        brand_id: brand.id,
        description: description || null
      },
      include: { _count: { select: { members: true } } }
    })

    return NextResponse.json({ ...house, rallies_count: 0 }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create house' }, { status: 500 })
  }
}
