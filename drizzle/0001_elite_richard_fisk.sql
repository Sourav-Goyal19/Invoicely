ALTER TABLE "invoice_item" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice_item" ALTER COLUMN "invoice_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice_item" ALTER COLUMN "total" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "invoice_item" ALTER COLUMN "total" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "signature_image_url" text;