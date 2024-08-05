"use client";
import EditBranchSheet from "@/features/branches/components/edit-branch-sheet";
import NewBranchSheet from "@/features/branches/components/new-branch-sheet";
import EditTransactionSheet from "@/features/transactions/components/edit-transaction-sheet";
import NewTransactionSheet from "@/features/transactions/components/new-transaction-sheet";
import { UserData } from "@/types";
import { useMountedState } from "react-use";

const SheetProvider = ({ user }: { user: UserData | null }) => {
  const isMounted = useMountedState();

  if (!isMounted) return null;

  return (
    <>
      <NewBranchSheet email={user?.email || ""} />
      <EditBranchSheet email={user?.email || ""} />
      <NewTransactionSheet email={user?.email || ""} />
      <EditTransactionSheet email={user?.email || ""} />
    </>
  );
};

export default SheetProvider;
