/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()

    const updateData: any = {}
    if (body.covetName !== undefined) updateData.covetName = body.covetName
    if (body.ownerName !== undefined) updateData.ownerName = body.ownerName
    if (body.role !== undefined) updateData.role = body.role
    if (body.houseId !== undefined) updateData.houseId = parseInt(body.houseId)
    if (body.activeTo !== undefined) updateData.activeTo = body.activeTo ? new Date(body.activeTo) : null
    if (body.activeFrom !== undefined) updateData.activeFrom = new Date(body.activeFrom)

    const member = await prisma.member.update({
      where: { id },
      data: updateData,
      include: { house: true }
    })
    return NextResponse.json(member)
  } catch {
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const member = await prisma.member.findUnique({
      where: { id },
      include: { house: true, scores: { include: { show: true } } }
    })
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    return NextResponse.json(member)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch member' }, { status: 500 })
  }
}
