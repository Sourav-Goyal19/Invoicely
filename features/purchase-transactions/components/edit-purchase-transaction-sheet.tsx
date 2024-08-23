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
import { insertPurchaseTransactionsSchema } from "@/db/schema";
import { PurchaseTransactionForm } from "@/features/purchase-transactions/components/purchase-transaction-form";
import { useOpenTransaction } from "@/features/purchase-transactions/hooks/use-edit-transaction";
import { useGetPurchaseTransaction } from "@/features/purchase-transactions/api/use-get-purchase-transaction";
import { useEditPurchaseTransaction } from "@/features/purchase-transactions/api/use-edit-purchase-transaction";
import { useDeletePurchaseTransaction } from "@/features/purchase-transactions/api/use-delete-purchase-transaction";
import { useConfirm } from "@/hooks/use-confirm";
import { useGetBranches } from "@/features/branches/api/use-get-branches";
import { useCreateBranch } from "@/features/branches/api/use-create-branch";
import { useGetCategories } from "@/features/categories/api/use-get-categories";
import { useCreateCategory } from "@/features/categories/api/use-create-category";

const apiSchema = insertPurchaseTransactionsSchema.omit({
  id: true,
  userId: true,
});

type ApiFormValues = z.input<typeof apiSchema>;

const EditPurchaseTransactionSheet = () => {
  const { data } = useSession();
  const { isOpen, onClose, id } = useOpenTransaction();
  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "You are about to delete this Transaction"
  );
  const transactionQuery = useGetPurchaseTransaction(id!, data?.user?.email!);
  const transactionMutation = useEditPurchaseTransaction(
    id!,
    data?.user?.email!
  );
  const deleteMutation = useDeletePurchaseTransaction(id!, data?.user?.email!);

  const branchQuery = useGetBranches(data?.user?.email!);
  const branchMutation = useCreateBranch(data?.user?.email!);
  // const onCreateBranch = (name: string,address:string, phone:string) =>
  //   branchMutation.mutate({
  //     name,
  //     address,
  //     phone,
  //   });
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
          <PurchaseTransactionForm
            id={id}
            onSubmit={onSubmit}
            defaultValues={defaultValues}
            disabled={isPending}
            onDelete={onDelete}
            branchOptions={branchOptions}
            // onCreateBranch={onCreateBranch}
            categoryOptions={categoryOptions}
            onCreateCategory={onCreateCategory}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};

export default EditPurchaseTransactionSheet;
