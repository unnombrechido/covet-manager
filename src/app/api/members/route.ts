/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const houseId = searchParams.get('houseId')
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const where: any = {}
    if (houseId) where.houseId = parseInt(houseId)
    if (activeOnly) where.activeTo = null

    const members = await prisma.member.findMany({
      where,
      include: { house: true },
      orderBy: { covetName: 'asc' }
    })
    return NextResponse.json(members)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { numericCode, covetName, ownerName, role, houseId, activeFrom } = body
    if (!numericCode || !covetName || !ownerName || !houseId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const member = await prisma.member.create({
      data: {
        numericCode: parseInt(numericCode),
        covetName,
        ownerName,
        role: role || 'member',
        houseId: parseInt(houseId),
        activeFrom: activeFrom ? new Date(activeFrom) : new Date()
      },
      include: { house: true }
    })
    return NextResponse.json(member, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Numeric code already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 })
  }
}
