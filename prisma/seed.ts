import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const house1 = await prisma.house.create({
    data: {
      name: 'House of Glamour',
      covetName: 'GlamourHouse',
      ownerName: 'Victoria',
      isActive: true
    }
  })

  const house2 = await prisma.house.create({
    data: {
      name: 'Fashion Empire',
      covetName: 'FashionEmpire',
      ownerName: 'Isabella',
      isActive: true
    }
  })

  const members1 = await Promise.all([
    prisma.member.create({ data: { numericCode: 1001, covetName: 'VictoriaStyle', ownerName: 'Victoria', role: 'owner', houseId: house1.id } }),
    prisma.member.create({ data: { numericCode: 1002, covetName: 'GlamourQueen', ownerName: 'Sophie', role: 'manager', houseId: house1.id } }),
    prisma.member.create({ data: { numericCode: 1003, covetName: 'FashionIcon', ownerName: 'Emma', role: 'member', houseId: house1.id } }),
    prisma.member.create({ data: { numericCode: 1004, covetName: 'StyleStar', ownerName: 'Olivia', role: 'member', houseId: house1.id } }),
    prisma.member.create({ data: { numericCode: 1005, covetName: 'TrendSetter', ownerName: 'Ava', role: 'member', houseId: house1.id } }),
  ])

  const members2 = await Promise.all([
    prisma.member.create({ data: { numericCode: 2001, covetName: 'EmpressIsabella', ownerName: 'Isabella', role: 'owner', houseId: house2.id } }),
    prisma.member.create({ data: { numericCode: 2002, covetName: 'CoutureKing', ownerName: 'James', role: 'manager', houseId: house2.id } }),
    prisma.member.create({ data: { numericCode: 2003, covetName: 'VogueVixen', ownerName: 'Charlotte', role: 'member', houseId: house2.id } }),
    prisma.member.create({ data: { numericCode: 2004, covetName: 'RunwayRose', ownerName: 'Amelia', role: 'member', houseId: house2.id } }),
    prisma.member.create({ data: { numericCode: 2005, covetName: 'ChicCharlotte', ownerName: 'Grace', role: 'member', houseId: house2.id } }),
  ])

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const rally1 = await prisma.rally.create({
    data: {
      name: `Glamour House Rally - ${currentMonth}/${currentYear}`,
      month: currentMonth,
      year: currentYear,
      houseId: house1.id
    }
  })

  const show1 = await prisma.show.create({ data: { name: 'Winter Gala', code: 'WG01', showType: 'regular', rallyId: rally1.id } })
  const show2 = await prisma.show.create({ data: { name: 'Holiday Special', code: 'HS01', showType: 'special', rallyId: rally1.id } })

  await Promise.all(members1.map((m, i) => prisma.score.create({
    data: {
      showId: show1.id,
      memberId: m.id,
      score: 85 + i * 3,
      annotation: i === 3 ? "didn't participate" : null
    }
  })))

  await Promise.all(members1.map((m, i) => prisma.score.create({
    data: {
      showId: show2.id,
      memberId: m.id,
      score: 90 + i * 2,
      annotation: null
    }
  })))

  const rally2 = await prisma.rally.create({
    data: {
      name: `Fashion Empire Rally - ${currentMonth}/${currentYear}`,
      month: currentMonth,
      year: currentYear,
      houseId: house2.id
    }
  })

  const show3 = await prisma.show.create({ data: { name: 'Spring Collection', code: 'SC01', showType: 'regular', rallyId: rally2.id } })

  await Promise.all(members2.map((m, i) => prisma.score.create({
    data: {
      showId: show3.id,
      memberId: m.id,
      score: 88 + i * 4,
      annotation: null
    }
  })))

  console.log('Seed completed successfully!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
