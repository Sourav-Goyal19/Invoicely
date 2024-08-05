import { Select } from "@/components/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCreateBranch } from "@/features/branches/api/use-create-branch";
import { useGetBranches } from "@/features/branches/api/use-get-branches";
import { useSession } from "next-auth/react";
import { useRef, useState } from "react";

export const useSelectBranch = (): [
  () => JSX.Element,
  () => Promise<unknown>
] => {
  const [promise, setPromise] = useState<{
    resolve: (value: string | undefined) => void;
  } | null>(null);

  const selectValue = useRef<string>();
  const { data } = useSession();

  const branchQuery = useGetBranches(data?.user?.email!);
  const branchMutation = useCreateBranch(data?.user?.email!);

  const onCreateBranch = (name: string) => {
    branchMutation.mutate({ name });
  };
  const branchOptions = (branchQuery.data || []).map((branch) => ({
    value: branch.id,
    label: branch.name,
  }));

  const confirm = () =>
    new Promise((resolve, reject) => {
      setPromise({ resolve });
    });

  const handleClose = () => {
    setPromise(null);
  };

  const handleConfirm = () => {
    promise?.resolve(selectValue.current);
    handleClose();
  };

  const handleCancel = () => {
    promise?.resolve(undefined);
    handleClose();
  };

  const ConfirmationDialog = () => (
    <Dialog open={promise !== null} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Branch</DialogTitle>
          <DialogDescription>
            Please select branch to continue
          </DialogDescription>
        </DialogHeader>
        <Select
          options={branchOptions}
          placeholder="Select an branch"
          onCreate={onCreateBranch}
          onChange={(branchId) => {
            selectValue.current = branchId;
          }}
          disabled={branchMutation.isPending || branchQuery.isLoading}
        />
        <DialogFooter className="pt-2 gap-2 ">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return [ConfirmationDialog, confirm];
};
