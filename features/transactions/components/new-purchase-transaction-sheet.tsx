import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { z } from "zod";
import { useSession } from "next-auth/react";
import { insertPurchaseTransactionsSchema } from "@/db/schema";
import { Loader2 } from "lucide-react";

import { PurchaseTransactionForm } from "./purchase-transaction-form";
import { useNewTransaction } from "../hooks/use-new-transaction";
import { useCreatePurchaseTransaction } from "../api/use-create-transaction";

import { useGetBranches } from "@/features/branches/api/use-get-branches";
import { useCreateBranch } from "@/features/branches/api/use-create-branch";
import { useGetCategories } from "@/features/categories/api/use-get-categories";
import { useCreateCategory } from "@/features/categories/api/use-create-category";

const apiFormFields = insertPurchaseTransactionsSchema.omit({
  id: true,
  userId: true,
});

type ApiFormValues = z.input<typeof apiFormFields>;

const NewPurchaseTransactionSheet = () => {
  const { isOpen, onClose } = useNewTransaction();
  const { data } = useSession();

  const branchQuery = useGetBranches(data?.user?.email!);
  const branchMutation = useCreateBranch(data?.user?.email!);
  const onCreateBranch = (name: string) =>
    branchMutation.mutate({
      name,
    });
  const branchOptions = (branchQuery.data || []).map((branch) => ({
    label: branch.name,
    value: branch.id,
  }));

  const categoryQuery = useGetCategories(data?.user?.email!);
  const categoryMutation = useCreateCategory(data?.user?.email!);
  const onCreateCategory = (name: string) =>
    categoryMutation.mutate({
      name,
    });
  const categoryOptions = (categoryQuery.data || []).map((category) => ({
    label: category.name,
    value: category.id,
  }));

  const transactionMutation = useCreatePurchaseTransaction(data?.user?.email!);

  const isPending = branchMutation.isPending || transactionMutation.isPending;

  const isLoading = branchQuery.isLoading;

  const onSubmit = (data: ApiFormValues) => {
    transactionMutation.mutate(data, {
      onSuccess: () => {
        onClose();
      },
      onError: (error) => {
        console.log(error);
      },
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="space-y-4 overflow-y-auto">
        <SheetHeader>
          <SheetTitle> New Transaction </SheetTitle>
          <SheetDescription>Add a new transaction.</SheetDescription>
        </SheetHeader>
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
          </div>
        ) : (
          <PurchaseTransactionForm
            onSubmit={onSubmit}
            disabled={isPending}
            branchOptions={branchOptions}
            onCreateBranch={onCreateBranch}
            categoryOptions={categoryOptions}
            onCreateCategory={onCreateCategory}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};

export default NewPurchaseTransactionSheet;
