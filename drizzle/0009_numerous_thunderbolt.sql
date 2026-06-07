ALTER TYPE "public"."booking_status" ADD VALUE 'manual';--> statement-breakpoint
CREATE INDEX "time_slot_date_status_idx" ON "Aruppukottai_turf_time_slot" USING btree ("date","status");