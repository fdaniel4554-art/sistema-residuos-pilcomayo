-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('STRIKE', 'CONSTRUCTION', 'ACCIDENT', 'WEATHER', 'ROAD_CLOSURE', 'OTHER');

-- CreateTable
CREATE TABLE "external_events" (
    "id" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "description" TEXT NOT NULL,
    "affectedStreets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radius" INTEGER NOT NULL DEFAULT 500,
    "severity" "SeverityLevel" NOT NULL DEFAULT 'MEDIUM',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "external_events_active_idx" ON "external_events"("active");

-- CreateIndex
CREATE INDEX "external_events_type_idx" ON "external_events"("type");
