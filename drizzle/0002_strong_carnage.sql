ALTER TABLE "transactions" ALTER COLUMN "cgst_percent" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "cgst_percent" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "sgst_percent" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "sgst_percent" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "cgst_amount" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "cgst_amount" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "sgst_amount" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "sgst_amount" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "total" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "total" SET DEFAULT '0';