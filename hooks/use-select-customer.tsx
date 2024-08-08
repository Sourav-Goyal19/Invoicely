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

interface CustomerDetails {
  customerName?: string;
  branchId?: string;
  GST?: number;
  paymentType?: string;
}

interface ConfirmationDialogProps {
  open: boolean;
  onConfirm: (customerDetails: CustomerDetails) => void;
  onCancel: () => void;
  onCreateBranch: (name: string) => void;
  branchOptions: { value: string; label: string }[];
  isLoading: boolean;
}

const ConfirmationDialog = ({
  open,
  onConfirm,
  onCancel,
  onCreateBranch,
  branchOptions,
  isLoading,
}: ConfirmationDialogProps) => {
  const [customerName, setCustomerName] = useState<string | undefined>(
    undefined
  );
  const [branchId, setBranchId] = useState<string | undefined>(undefined);
  const [GST, setGST] = useState<number | undefined>(undefined);
  const [paymentType, setPaymentType] = useState<string | undefined>(undefined);

  const handleConfirm = () => {
    onConfirm({ customerName, branchId, GST, paymentType });
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent>
        <Input
          placeholder="Enter customer name"
          onChange={(e) => setCustomerName(e.target.value)}
        />
        <Select
          options={branchOptions}
          placeholder="Select a branch"
          onCreate={onCreateBranch}
          onChange={(id) => setBranchId(id)}
          disabled={isLoading}
        />
        <Input
          placeholder="Enter GST Amount"
          type="number"
          onChange={(e) => setGST(Number(e.target.value))}
        />
        <ShadcnSelect onValueChange={setPaymentType}>
          <SelectTrigger>
            <SelectValue placeholder="Select payment type" />
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

export const useSelectCustomer = (): [
  () => JSX.Element,
  () => Promise<CustomerDetails>
] => {
  const { data } = useSession();
  const [promise, setPromise] = useState<{
    resolve: (customerDetails: CustomerDetails) => void;
  } | null>(null);

  const branchQuery = useGetBranches(data?.user?.email!);
  const branchMutation = useCreateBranch(data?.user?.email!);

  const branchOptions = (branchQuery.data || []).map((branch) => ({
    value: branch.id,
    label: branch.name,
  }));

  const onCreateBranch = (name: string) => {
    branchMutation.mutate({ name });
  };

  const confirm = () =>
    new Promise<CustomerDetails>((resolve, reject) => {
      setPromise({ resolve });
    });

  const handleClose = () => {
    promise?.resolve({
      customerName: undefined,
      branchId: undefined,
      GST: undefined,
      paymentType: undefined,
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
      isLoading={branchMutation.isPending || branchQuery.isLoading}
    />
  );

  return [confirmationDialog, confirm];
};
