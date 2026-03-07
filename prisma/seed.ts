import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const today = new Date()
  const currentMonthLabel = today.toLocaleString('en-US', { month: 'long' })

  // Clear child tables first to satisfy foreign key constraints.
  await prisma.participations.deleteMany()
  await prisma.directivos.deleteMany()
  await prisma.shows.deleteMany()
  await prisma.rallies.deleteMany()
  await prisma.members.deleteMany()
  await prisma.houses.deleteMany()
  await prisma.brands.deleteMany()

  const brand = await prisma.brands.create({
    data: {
      name: 'Covet Elite',
      description: 'Primary brand seeded for local development.'
    }
  })

  const house1 = await prisma.houses.create({
    data: {
      brand_id: brand.id,
      name: 'House of Glamour',
      description: 'Main competitive house'
    }
  })

  const house2 = await prisma.houses.create({
    data: {
      brand_id: brand.id,
      name: 'Fashion Empire',
      description: 'Second seeded house'
    }
  })

  const members1 = await Promise.all([
    prisma.members.create({ data: { house_id: house1.id, cuenta: 'VictoriaStyle', nombre: 'Victoria', activo: true, fecha_ingreso: today } }),
    prisma.members.create({ data: { house_id: house1.id, cuenta: 'GlamourQueen', nombre: 'Sophie', activo: true, fecha_ingreso: today } }),
    prisma.members.create({ data: { house_id: house1.id, cuenta: 'FashionIcon', nombre: 'Emma', activo: true, fecha_ingreso: today } }),
    prisma.members.create({ data: { house_id: house1.id, cuenta: 'StyleStar', nombre: 'Olivia', activo: true, fecha_ingreso: today } }),
    prisma.members.create({ data: { house_id: house1.id, cuenta: 'TrendSetter', nombre: 'Ava', activo: true, fecha_ingreso: today } })
  ])

  const members2 = await Promise.all([
    prisma.members.create({ data: { house_id: house2.id, cuenta: 'EmpressIsabella', nombre: 'Isabella', activo: true, fecha_ingreso: today } }),
    prisma.members.create({ data: { house_id: house2.id, cuenta: 'CoutureKing', nombre: 'James', activo: true, fecha_ingreso: today } }),
    prisma.members.create({ data: { house_id: house2.id, cuenta: 'VogueVixen', nombre: 'Charlotte', activo: true, fecha_ingreso: today } }),
    prisma.members.create({ data: { house_id: house2.id, cuenta: 'RunwayRose', nombre: 'Amelia', activo: true, fecha_ingreso: today } }),
    prisma.members.create({ data: { house_id: house2.id, cuenta: 'ChicCharlotte', nombre: 'Grace', activo: true, fecha_ingreso: today } })
  ])

  await prisma.directivos.createMany({
    data: [
      { house_id: house1.id, member_id: members1[0].id, role: 'owner' },
      { house_id: house1.id, member_id: members1[1].id, role: 'manager' },
      { house_id: house2.id, member_id: members2[0].id, role: 'owner' },
      { house_id: house2.id, member_id: members2[1].id, role: 'manager' }
    ]
  })

  const rally = await prisma.rallies.create({
    data: {
      brand_id: brand.id,
      month: currentMonthLabel,
      rally_number: 1,
      start_day: 1,
      end_day: 28,
      slot_ini: 'A',
      slot_fin: 'F'
    }
  })

  const show1 = await prisma.shows.create({
    data: {
      rally_id: rally.id,
      show_number: 1,
      name: 'Winter Gala',
      details: 'Regular challenge'
    }
  })

  const show2 = await prisma.shows.create({
    data: {
      rally_id: rally.id,
      show_number: 2,
      name: 'Holiday Special',
      details: 'Special challenge'
    }
  })

  await Promise.all(
    members1.map((member, index) =>
      prisma.participations.create({
        data: {
          member_id: member.id,
          show_id: show1.id,
          status: index === 3 ? 'absent' : 'participated',
          points: index === 3 ? 0 : 85 + index * 3,
          notes: index === 3 ? 'did not participate' : null
        }
      })
    )
  )

  await Promise.all(
    members2.map((member, index) =>
      prisma.participations.create({
        data: {
          member_id: member.id,
          show_id: show2.id,
          status: 'participated',
          points: 88 + index * 4,
          notes: null
        }
      })
    )
  )

  console.log('Seed completed successfully!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
