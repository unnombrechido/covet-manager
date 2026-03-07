/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function monthNameToNumber(month: string) {
  const index = MONTH_NAMES.findIndex((item) => item.toLowerCase() === month.toLowerCase())
  return index >= 0 ? index + 1 : 1
}

function monthNumberToName(month: number) {
  return MONTH_NAMES[Math.max(1, Math.min(12, month)) - 1]
}

function serializeRally(
  rally: {
    id: number
    month: string
    rally_number: number
    slot_ini: string | null
    slot_fin: string | null
    created_at: Date | null
    _count?: { shows: number }
  },
  house: { id: number; name: string } | null
) {
  const fallbackYear = rally.created_at ? new Date(rally.created_at).getFullYear() : new Date().getFullYear()
  const year = rally.slot_fin ? parseInt(rally.slot_fin) : fallbackYear

  return {
    id: rally.id,
    name: rally.slot_ini || `Rally ${monthNameToNumber(rally.month)}/${year}`,
    month: monthNameToNumber(rally.month),
    year,
    houseId: house?.id ?? null,
    house,
    createdAt: rally.created_at?.toISOString() ?? new Date().toISOString(),
    _count: {
      shows: rally._count?.shows ?? 0
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const houseId = searchParams.get('house_id')

    const where: any = {}
    let selectedHouse: { id: number; name: string; brand_id: number | null } | null = null

    if (houseId) {
      selectedHouse = await prisma.houses.findUnique({
        where: { id: parseInt(houseId) },
        select: { id: true, name: true, brand_id: true }
      })
      if (!selectedHouse) {
        return NextResponse.json([])
      }
      where.brand_id = selectedHouse.brand_id
    }

    const rallies = await prisma.rallies.findMany({
      where,
      include: {
        brands: {
          include: {
            houses: {
              select: { id: true, name: true }
            }
          }
        },
        _count: { select: { shows: true } }
      },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }]
    })

    const response = rallies.map((rally) => {
      const fallbackHouse = rally.brands?.houses?.[0] ?? null
      const rallyHouse = selectedHouse ?? fallbackHouse
      return serializeRally(rally, rallyHouse)
    })

    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch rallies' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, month, year, house_id } = body
    if (!name || !month || !year || !house_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const house = await prisma.houses.findUnique({
      where: { id: parseInt(house_id) },
      select: { id: true, name: true, brand_id: true }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    let brandId = house.brand_id
    if (!brandId) {
      const brand = await prisma.brands.create({
        data: { name: `${house.name} Brand` }
      })
      brandId = brand.id
      await prisma.houses.update({
        where: { id: house.id },
        data: { brand_id: brandId }
      })
    }

    const currentCount = await prisma.rallies.count({ where: { brand_id: brandId } })

    const rally = await prisma.rallies.create({
      data: {
        brand_id: brandId,
        month: monthNumberToName(parseInt(month)),
        rally_number: currentCount + 1,
        start_day: 1,
        end_day: 28,
        slot_ini: name,
        slot_fin: String(year)
      },
      include: {
        _count: { select: { shows: true } }
      }
    })

    return NextResponse.json(
      serializeRally(rally, { id: house.id, name: house.name }),
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Failed to create rally' }, { status: 500 })
  }
}
