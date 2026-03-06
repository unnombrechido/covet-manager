/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const houseId = searchParams.get('houseId')

    const where: any = {}
    if (houseId) where.houseId = parseInt(houseId)

    const rallies = await prisma.rally.findMany({
      where,
      include: {
        house: true,
        _count: { select: { shows: true } }
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    })
    return NextResponse.json(rallies)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch rallies' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, month, year, houseId } = body
    if (!name || !month || !year || !houseId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const rally = await prisma.rally.create({
      data: {
        name,
        month: parseInt(month),
        year: parseInt(year),
        houseId: parseInt(houseId)
      },
      include: { house: true }
    })
    return NextResponse.json(rally, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create rally' }, { status: 500 })
  }
}
