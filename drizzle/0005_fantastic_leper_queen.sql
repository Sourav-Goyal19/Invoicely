ALTER TABLE "transactions" DROP CONSTRAINT "transactions_branch_id_branches_id_fk";
--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "branch_id";