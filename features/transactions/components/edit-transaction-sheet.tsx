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
import { insertTransactionsSchema } from "@/db/schema";
import { TransactionForm } from "@/features/transactions/components/transaction-form";
import { useOpenTransaction } from "@/features/transactions/hooks/use-edit-transaction";
import { useGetTransaction } from "@/features/transactions/api/use-get-transaction";
import { useEditTransaction } from "@/features/transactions/api/use-edit-transaction";
import { useDeleteTransaction } from "@/features/transactions/api/use-delete-transaction";
import { useConfirm } from "@/hooks/use-confirm";
import { useGetBranches } from "@/features/branches/api/use-get-branches";
import { useCreateBranch } from "@/features/branches/api/use-create-branch";

const apiSchema = insertTransactionsSchema.omit({
  id: true,
  userId: true,
});

type ApiFormValues = z.input<typeof apiSchema>;

const EditTransactionSheet = () => {
  const { data } = useSession();
  const { isOpen, onClose, id } = useOpenTransaction();
  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "You are about to delete this Transaction"
  );
  const transactionQuery = useGetTransaction(id!, data?.user?.email!);
  const transactionMutation = useEditTransaction(id!, data?.user?.email!);
  const deleteMutation = useDeleteTransaction(id!, data?.user?.email!);

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
    branchMutation.isPending;

  const isLoading = branchQuery.isLoading || transactionQuery.isLoading;

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
        branchId: transactionQuery.data.branchId,
        product: transactionQuery.data.product,
        price: transactionQuery.data.price,
        quantity: transactionQuery.data.quantity,
        total: Number(transactionQuery.data.total),
        sgstPercent: Number(transactionQuery.data.sgstPercent),
        cgstPercent: Number(transactionQuery.data.cgstPercent),
        sgstAmount: Number(transactionQuery.data.sgstAmount),
        cgstAmount: Number(transactionQuery.data.cgstAmount),
        paymentType: transactionQuery.data.paymentType,
        date: transactionQuery.data.date
          ? new Date(transactionQuery.data.date)
          : new Date(),
      }
    : {
        date: new Date(),
        branchId: "",
        product: "",
        price: 0,
        quantity: 1,
        sgstPercent: 0,
        cgstPercent: 0,
        sgstAmount: 0,
        cgstAmount: 0,
        paymentType: "cash",
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
          <TransactionForm
            id={id}
            onSubmit={onSubmit}
            defaultValues={defaultValues}
            disabled={isPending}
            onDelete={onDelete}
            branchOptions={branchOptions}
            onCreateBranch={onCreateBranch}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};

export default EditTransactionSheet;
