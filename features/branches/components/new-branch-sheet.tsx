import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useNewBranch } from "../hooks/use-new-branch";
import { BranchForm } from "./branch-form";
import { insertBranchSchema } from "@/db/schema";
import { z } from "zod";
import { useCreateBranch } from "../api/use-create-branch";
import { useSession } from "next-auth/react";

const formFields = insertBranchSchema.pick({
  name: true,
  address: true,
  phone: true,
  gstNo: true,
});

type FormValues = z.input<typeof formFields>;

const NewBranchSheet = () => {
  const { isOpen, onClose } = useNewBranch();
  const { data } = useSession();
  const mutation = useCreateBranch(data?.user?.email!);

  const onSubmit = (data: FormValues) => {
    mutation.mutate(
      {
        name: data.name,
        address: data.address,
        phone: data.phone,
        gstNo: data.gstNo,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="space-y-4">
        <SheetHeader>
          <SheetTitle> New Branch </SheetTitle>
          <SheetDescription>
            Create a new branch to track your transactions.
          </SheetDescription>
        </SheetHeader>
        <BranchForm onSubmit={onSubmit} disabled={mutation.isPending} />
      </SheetContent>
    </Sheet>
  );
};

export default NewBranchSheet;
