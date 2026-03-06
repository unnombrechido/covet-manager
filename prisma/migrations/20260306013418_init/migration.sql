-- CreateTable
CREATE TABLE "House" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "covetName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Member" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numericCode" INTEGER NOT NULL,
    "covetName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "activeFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeTo" DATETIME,
    "houseId" INTEGER NOT NULL,
    CONSTRAINT "Member_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Rally" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "houseId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Rally_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Show" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rallyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "showType" TEXT NOT NULL,
    CONSTRAINT "Show_rallyId_fkey" FOREIGN KEY ("rallyId") REFERENCES "Rally" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Score" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "showId" INTEGER NOT NULL,
    "memberId" INTEGER NOT NULL,
    "score" REAL NOT NULL DEFAULT 0,
    "annotation" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Score_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Score_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_numericCode_key" ON "Member"("numericCode");

-- CreateIndex
CREATE UNIQUE INDEX "Score_showId_memberId_key" ON "Score"("showId", "memberId");
