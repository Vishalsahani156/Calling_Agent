-- CreateEnum
CREATE TYPE "AnalyticsRollupGranularity" AS ENUM ('day');

-- CreateTable
CREATE TABLE "analytics_rollups" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "campaign_id" UUID,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "granularity" "AnalyticsRollupGranularity" NOT NULL DEFAULT 'day',
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_rollups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_rollups_organization_id_period_start_idx" ON "analytics_rollups"("organization_id", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_rollups_organization_id_campaign_id_period_start_granularity_key" ON "analytics_rollups"("organization_id", "campaign_id", "period_start", "granularity");

-- AddForeignKey
ALTER TABLE "analytics_rollups" ADD CONSTRAINT "analytics_rollups_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_rollups" ADD CONSTRAINT "analytics_rollups_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
