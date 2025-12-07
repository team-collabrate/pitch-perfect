ALTER TABLE "Aruppukottai_turf_account" RENAME TO "account";--> statement-breakpoint
ALTER TABLE "Aruppukottai_turf_session" RENAME TO "session";--> statement-breakpoint
ALTER TABLE "Aruppukottai_turf_user" RENAME TO "user";--> statement-breakpoint
ALTER TABLE "Aruppukottai_turf_verification" RENAME TO "verification";--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "Aruppukottai_turf_session_token_unique";--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "Aruppukottai_turf_user_email_unique";--> statement-breakpoint
ALTER TABLE "account" DROP CONSTRAINT "Aruppukottai_turf_account_userId_Aruppukottai_turf_user_id_fk";
--> statement-breakpoint
ALTER TABLE "Aruppukottai_turf_manager" DROP CONSTRAINT "Aruppukottai_turf_manager_authId_Aruppukottai_turf_user_id_fk";
--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "Aruppukottai_turf_session_userId_Aruppukottai_turf_user_id_fk";
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Aruppukottai_turf_manager" ADD CONSTRAINT "Aruppukottai_turf_manager_authId_user_id_fk" FOREIGN KEY ("authId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_token_unique" UNIQUE("token");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_email_unique" UNIQUE("email");