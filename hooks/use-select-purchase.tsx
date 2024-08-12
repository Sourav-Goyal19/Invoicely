"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Select } from "@/components/select";
import { useCreateBranch } from "@/features/branches/api/use-create-branch";
import { useGetBranches } from "@/features/branches/api/use-get-branches";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetCategories } from "@/features/categories/api/use-get-categories";
import { SelectCategories } from "@/components/multiple-category";

interface PurchaseDetails {
  branchId?: string;
  GST?: number;
  totalAmount?: number;
  paymentType?: string;
  categoryIds?: string[];
}

interface ConfirmationDialogProps {
  open: boolean;
  onConfirm: (purchaseDetails: PurchaseDetails) => void;
  onCancel: () => void;
  onCreateBranch: (name: string) => void;
  branchOptions: { value: string; label: string }[];
  categoryOptions: { value: string; label: string }[];
  isLoading: boolean;
}

const ConfirmationDialog = ({
  open,
  onConfirm,
  onCancel,
  onCreateBranch,
  branchOptions,
  categoryOptions,
  isLoading,
}: ConfirmationDialogProps) => {
  const [branchId, setBranchId] = useState<string | undefined>(undefined);
  const [GST, setGST] = useState<number | undefined>(undefined);
  const [totalAmount, setTotalAmount] = useState<number | undefined>(undefined);
  const [paymentType, setPaymentType] = useState<string | undefined>(undefined);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);

  const handleConfirm = () => {
    onConfirm({ branchId, GST, paymentType, categoryIds, totalAmount });
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent>
        <Select
          options={branchOptions}
          placeholder="Select a branch"
          onCreate={onCreateBranch}
          onChange={(id) => setBranchId(id)}
          disabled={isLoading}
        />
        <SelectCategories
          categoryOptions={categoryOptions}
          onChange={(values) => {
            setCategoryIds(values);
          }}
          placeholder="Select Categories"
          disabled={isLoading}
        />
        <Input
          placeholder="Enter Total Amount"
          type="number"
          onChange={(e) => setTotalAmount(Number(e.target.value))}
        />
        <Input
          placeholder="Enter GST Amount"
          type="number"
          onChange={(e) => setGST(Number(e.target.value))}
        />
        <ShadcnSelect onValueChange={setPaymentType}>
          <SelectTrigger>
            <SelectValue
              placeholder="Select Payment Type"
              className="text-gray-400"
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Cash">Cash</SelectItem>
            <SelectItem value="Bank">Bank</SelectItem>
          </SelectContent>
        </ShadcnSelect>
        <DialogFooter>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const useSelectPurchase = (): [
  () => JSX.Element,
  () => Promise<PurchaseDetails>
] => {
  const { data } = useSession();
  const [promise, setPromise] = useState<{
    resolve: (purchaseDetails: PurchaseDetails) => void;
  } | null>(null);

  const branchQuery = useGetBranches(data?.user?.email!);
  const branchMutation = useCreateBranch(data?.user?.email!);

  const categoryQuery = useGetCategories(data?.user?.email!);

  const categoryOptions = (categoryQuery.data || []).map((category) => ({
    value: category.id,
    label: category.name,
  }));

  const branchOptions = (branchQuery.data || []).map((branch) => ({
    value: branch.id,
    label: branch.name,
  }));

  const onCreateBranch = (name: string) => {
    branchMutation.mutate({ name });
  };

  const confirm = () =>
    new Promise<PurchaseDetails>((resolve, reject) => {
      setPromise({ resolve });
    });

  const handleClose = () => {
    promise?.resolve({
      branchId: undefined,
      GST: undefined,
      paymentType: undefined,
      categoryIds: [],
    });
    setPromise(null);
  };

  const confirmationDialog = () => (
    <ConfirmationDialog
      open={promise !== null}
      onConfirm={(customerDetails) => {
        promise?.resolve(customerDetails);
        handleClose();
      }}
      onCancel={handleClose}
      onCreateBranch={onCreateBranch}
      branchOptions={branchOptions}
      categoryOptions={categoryOptions}
      isLoading={
        branchMutation.isPending ||
        branchQuery.isLoading ||
        categoryQuery.isLoading
      }
    />
  );

  return [confirmationDialog, confirm];
};
