"use client";
import EditBranchSheet from "@/features/branches/components/edit-branch-sheet";
import NewBranchSheet from "@/features/branches/components/new-branch-sheet";
import EditCategorySheet from "@/features/categories/components/edit-category-sheet";
import NewCategorySheet from "@/features/categories/components/new-category-sheet";
import EditTransactionSheet from "@/features/transactions/components/edit-transaction-sheet";
import NewTransactionSheet from "@/features/transactions/components/new-transaction-sheet";
import { useMountedState } from "react-use";

const SheetProvider = () => {
  const isMounted = useMountedState();

  if (!isMounted) return null;

  return (
    <>
      <NewBranchSheet />
      <EditBranchSheet />
      <NewCategorySheet />
      <EditCategorySheet />
      <NewTransactionSheet />
      <EditTransactionSheet />
    </>
  );
};

export default SheetProvider;
