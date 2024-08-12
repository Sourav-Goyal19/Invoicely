import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { insertSalesTransactionsSchema } from "@/db/schema";
import { SalesTransactionForm } from "@/features/sales-transactions/components/sales-transaction-form";
import { useOpenTransaction } from "@/features/sales-transactions/hooks/use-edit-transaction";
import { useGetSalesTransaction } from "@/features/sales-transactions/api/use-get-sales-transaction";
import { useEditSalesTransaction } from "@/features/sales-transactions/api/use-edit-sales-transaction";
import { useDeleteSalesTransaction } from "@/features/sales-transactions/api/use-delete-sales-transaction";
import { useConfirm } from "@/hooks/use-confirm";
import { useGetBranches } from "@/features/branches/api/use-get-branches";
import { useCreateBranch } from "@/features/branches/api/use-create-branch";
import { useGetCategories } from "@/features/categories/api/use-get-categories";
import { useCreateCategory } from "@/features/categories/api/use-create-category";

const apiSchema = insertSalesTransactionsSchema.omit({
  id: true,
  userId: true,
});

type ApiFormValues = z.input<typeof apiSchema>;

const EditSalesTransactionSheet = () => {
  const { data } = useSession();
  const { isOpen, onClose, id } = useOpenTransaction();
  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "You are about to delete this Transaction"
  );
  const transactionQuery = useGetSalesTransaction(id!, data?.user?.email!);
  const transactionMutation = useEditSalesTransaction(id!, data?.user?.email!);
  const deleteMutation = useDeleteSalesTransaction(id!, data?.user?.email!);

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

  // console.log(transactionQuery.data);

  const onSubmit = (data: ApiFormValues) => {
    transactionMutation.mutate(data, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const isPending =
    transactionMutation.isPending ||
    deleteMutation.isPending ||
    branchMutation.isPending ||
    categoryMutation.isPending;

  const isLoading =
    branchQuery.isLoading ||
    transactionQuery.isLoading ||
    categoryQuery.isLoading;

  const onDelete = async () => {
    const ok = await confirm();
    if (ok) {
      deleteMutation.mutate(undefined, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  const defaultValues = transactionQuery.data
    ? {
        categoryId: transactionQuery.data.categoryId,
        product: transactionQuery.data.product,
        price: transactionQuery.data.price,
        quantity: transactionQuery.data.quantity,
        total: Number(transactionQuery.data.total),
        date: transactionQuery.data.date
          ? new Date(transactionQuery.data.date)
          : new Date(),
      }
    : {
        date: new Date(),
        categoryId: "",
        product: "",
        price: 0,
        quantity: 1,
        total: 0,
      };

  return (
    <Sheet
      open={isOpen && transactionQuery.data != undefined}
      onOpenChange={onClose}
    >
      <ConfirmDialog />
      <SheetContent className="space-y-4">
        <SheetHeader>
          <SheetTitle> Edit Transaction </SheetTitle>
          <SheetDescription>Edit an existing Transaction.</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <SalesTransactionForm
            id={id}
            onSubmit={onSubmit}
            defaultValues={defaultValues}
            disabled={isPending}
            onDelete={onDelete}
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

export default EditSalesTransactionSheet;
