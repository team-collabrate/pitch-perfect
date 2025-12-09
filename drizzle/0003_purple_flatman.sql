CREATE TYPE "public"."banner_status" AS ENUM('active', 'inactive', 'draft');--> statement-breakpoint
ALTER TABLE "Aruppukottai_turf_banner" RENAME COLUMN "type" TO "mediaType";--> statement-breakpoint
ALTER TABLE "Aruppukottai_turf_banner" RENAME COLUMN "bannerIndex" TO "displayOrder";--> statement-breakpoint
ALTER TABLE "Aruppukottai_turf_banner" ALTER COLUMN "title" SET DATA TYPE varchar(200);--> statement-breakpoint
ALTER TABLE "Aruppukottai_turf_banner" ALTER COLUMN "title" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Aruppukottai_turf_banner" ADD COLUMN "status" "banner_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "Aruppukottai_turf_banner" ADD COLUMN "cloudinaryPublicId" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "Aruppukottai_turf_banner" ADD COLUMN "cloudinaryUrl" varchar(512) NOT NULL;--> statement-breakpoint
ALTER TABLE "Aruppukottai_turf_banner" ADD COLUMN "updatedAt" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "banner_display_order_idx" ON "Aruppukottai_turf_banner" USING btree ("displayOrder");--> statement-breakpoint
CREATE INDEX "banner_status_idx" ON "Aruppukottai_turf_banner" USING btree ("status");--> statement-breakpoint
ALTER TABLE "Aruppukottai_turf_banner" DROP COLUMN "url";--> statement-breakpoint
ALTER TABLE "Aruppukottai_turf_banner" DROP COLUMN "bannerType";--> statement-breakpoint
ALTER TABLE "Aruppukottai_turf_banner" DROP COLUMN "language";--> statement-breakpoint
ALTER TABLE "Aruppukottai_turf_banner" DROP COLUMN "expireAt";--> statement-breakpoint
ALTER TABLE "Aruppukottai_turf_banner" ADD CONSTRAINT "Aruppukottai_turf_banner_cloudinaryPublicId_unique" UNIQUE("cloudinaryPublicId");