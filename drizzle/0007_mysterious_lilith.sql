ALTER TABLE "transactions" RENAME TO "purchase_transactions";--> statement-breakpoint
ALTER TABLE "purchase_transactions" DROP CONSTRAINT "transactions_category_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "purchase_transactions" DROP CONSTRAINT "transactions_user_id_users_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purchase_transactions" ADD CONSTRAINT "purchase_transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purchase_transactions" ADD CONSTRAINT "purchase_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
