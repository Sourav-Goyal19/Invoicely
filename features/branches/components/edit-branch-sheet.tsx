import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { z } from "zod";
import { BranchForm } from "./branch-form";
import { insertBranchSchema } from "@/db/schema";
import { useOpenBranch } from "../hooks/use-edit-branch";
import { useGetBranch } from "../api/use-get-branch";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { useEditBranch } from "../api/use-edit-branch";
import { useDeleteBranch } from "../api/use-delete-branch";
import { useConfirm } from "@/hooks/use-confirm";

const formFields = insertBranchSchema.pick({
  name: true,
  address: true,
  phone: true,
  gstNo: true,
});

type FormValues = z.input<typeof formFields>;

const EditBranchSheet = () => {
  const { data } = useSession();
  const { isOpen, onClose, id } = useOpenBranch();
  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "You are about to delete this branch"
  );

  const branchQuery = useGetBranch(id!, data?.user?.email!);

  // console.log(branchQuery.data);

  const mutation = useEditBranch(id!, data?.user?.email!);
  const deleteMutation = useDeleteBranch(id!, data?.user?.email!);

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const isPending = mutation.isPending || deleteMutation.isPending;

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

  const defaultValues = branchQuery.data && {
    name: branchQuery.data?.name,
    address: branchQuery.data?.address,
    phone: branchQuery.data?.phone,
    gstNo: branchQuery.data?.gstNo,
  };

  return (
    <Sheet
      open={isOpen && branchQuery.data != undefined}
      onOpenChange={onClose}
    >
      <ConfirmDialog />
      <SheetContent className="space-y-4">
        <SheetHeader>
          <SheetTitle> Edit Branch </SheetTitle>
          <SheetDescription>Edit an existing branch.</SheetDescription>
        </SheetHeader>

        {branchQuery.isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <BranchForm
            id={id}
            onSubmit={onSubmit}
            defaultValues={defaultValues}
            disabled={isPending}
            onDelete={onDelete}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};

export default EditBranchSheet;
