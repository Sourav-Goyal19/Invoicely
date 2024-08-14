"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { useNewBranch } from "@/features/branches/hooks/use-new-branch";
import { Loader2, Plus } from "lucide-react";
import { columns, ResponseType } from "./column";
import { useGetBranches } from "@/features/branches/api/use-get-branches";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import { useBulkDeleteBranches } from "@/features/branches/api/use-bulk-delete-branches";
import React, { Suspense } from "react";

const BranchesPageClient = () => {
  const { onOpen } = useNewBranch();
  const { data: authdata } = useSession();

  const branchQuery = useGetBranches(authdata?.user?.email!);
  const deleteBranches = useBulkDeleteBranches(authdata?.user?.email!);

  const isDisabled = branchQuery.isLoading || deleteBranches.isPending;

  const BranchClientFallback = () => {
    return (
      <div className="max-w-screen-2xl mx-auto w-full -mt-24 pb-10">
        <Card className="border-none drop-shadow-sm">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full flex items-center justify-center">
              <Loader2 className="size-12 text-slate-300 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const data: ResponseType[] = branchQuery.data || [];

  return (
    <Suspense fallback={<BranchClientFallback />}>
      <div className="max-w-screen-2xl mx-auto w-full -mt-24 pb-10">
        <Card className="border-none drop-shadow-sm">
          <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-xl line-clamp-1">Branches</CardTitle>
            <Button onClick={onOpen} size={"sm"}>
              <Plus className="size-4 mr-2" />
              Add New
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={data}
              filterKey="name"
              onDelete={(rows) => {
                const ids = rows.map((r) => r.original.id);
                const deleted = deleteBranches.mutate({
                  ids,
                });
                console.log(deleted);
              }}
              disabled={isDisabled}
            />
          </CardContent>
        </Card>
      </div>
    </Suspense>
  );
};

export default React.memo(BranchesPageClient);
