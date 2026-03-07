/* eslint-disable @typescript-eslint/no-explicit-any */
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
      return NextResponse.json({ error: 'Invalid member id' }, { status: 400 })
    }

    const body = await request.json()

    const existingMember = await prisma.members.findUnique({ where: { id } })
    if (!existingMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (body.linkCurrentUser === true) updateData.user_id = userId
    if (body.cuenta !== undefined) updateData.cuenta = body.cuenta
    if (body.nombre !== undefined) updateData.nombre = body.nombre
    if (body.house_id !== undefined) updateData.house_id = parseInt(body.house_id)
    if (body.fecha_salida !== undefined) updateData.fecha_salida = body.fecha_salida ? new Date(body.fecha_salida) : null
    if (body.fecha_ingreso !== undefined) updateData.fecha_ingreso = new Date(body.fecha_ingreso)

    const member = await prisma.members.update({
      where: { id },
      data: updateData,
      include: {
        houses: true,
        directivos: true
      }
    })

    if (body.role !== undefined) {
      await prisma.directivos.updateMany({
        where: {
          member_id: id,
          end_date: null
        },
        data: { end_date: new Date() }
      })

      if (body.role !== 'member') {
        await prisma.directivos.create({
          data: {
            member_id: id,
            house_id: member.house_id,
            role: body.role,
            start_date: new Date()
          }
        })
      }
    }

    const refreshedMember = await prisma.members.findUnique({
      where: { id },
      include: {
        houses: true,
        directivos: true
      }
    })

    const payload = refreshedMember ?? member
    return NextResponse.json({
      ...payload,
      role: getMemberRole(payload.directivos)
    })
  } catch {
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
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
      return NextResponse.json({ error: 'Invalid member id' }, { status: 400 })
    }

    const member = await prisma.members.findUnique({
      where: { id },
      include: {
        houses: true,
        directivos: true,
        participations: { include: { shows: true } }
      }
    })
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    return NextResponse.json({
      ...member,
      role: getMemberRole(member.directivos)
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch member' }, { status: 500 })
  }
}
