/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth'

function getMemberRole(directivos: Array<{ role: string; end_date: Date | null }>) {
  const active = directivos.find((item) => !item.end_date)
  return active?.role ?? 'member'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const houseId = searchParams.get('house_id')
    const activeOnly = searchParams.get('active_only') === 'true'

    const where: any = {}
    if (houseId) where.house_id = parseInt(houseId)
    if (activeOnly) where.fecha_salida = null

    const members = await prisma.members.findMany({
      where,
      include: {
        houses: true,
        directivos: true
      },
      orderBy: { cuenta: 'asc' }
    })

    return NextResponse.json(
      members.map((member) => ({
        ...member,
        role: getMemberRole(member.directivos)
      }))
    )
  } catch {
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { cuenta, nombre, role, house_id, fecha_ingreso } = body
    if (!cuenta || !nombre || !house_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const member = await prisma.members.create({
      data: {
        cuenta,
        nombre,
        house_id: parseInt(house_id),
        activo: true,
        fecha_ingreso: fecha_ingreso ? new Date(fecha_ingreso) : new Date(),
        fecha_salida: null,
        user_id: userId
      },
      include: {
        houses: true,
        directivos: true
      }
    })

    if (role && role !== 'member') {
      await prisma.directivos.create({
        data: {
          house_id: member.house_id,
          member_id: member.id,
          role,
          start_date: fecha_ingreso ? new Date(fecha_ingreso) : new Date()
        }
      })
    }

    const refreshedMember = await prisma.members.findUnique({
      where: { id: member.id },
      include: {
        houses: true,
        directivos: true
      }
    })

    return NextResponse.json(
      {
        ...(refreshedMember ?? member),
        role: getMemberRole((refreshedMember ?? member).directivos)
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Numeric code already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 })
  }
}
