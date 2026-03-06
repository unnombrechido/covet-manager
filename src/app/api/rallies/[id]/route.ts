import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const rally = await prisma.rally.findUnique({
      where: { id },
      include: {
        house: true,
        shows: {
          include: {
            _count: { select: { scores: true } },
            scores: { include: { member: true } }
          }
        }
      }
    })
    if (!rally) return NextResponse.json({ error: 'Rally not found' }, { status: 404 })
    return NextResponse.json(rally)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch rally' }, { status: 500 })
  }
}
