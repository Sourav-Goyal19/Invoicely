ALTER TABLE "transactions" DROP COLUMN IF EXISTS "payment_type";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "cgst_percent";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "sgst_percent";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "cgst_amount";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "sgst_amount";