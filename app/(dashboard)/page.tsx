"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { useGetInvoices } from "@/features/invoice/api/use-get-invoices";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { columns } from "./column";
import { useGetBranches } from "@/features/branches/api/use-get-branches";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const HomePage = () => {
  const { data } = useSession();

  const branchQuery = useGetBranches(data?.user?.email!);

  const branchOptions =
    branchQuery.data?.map((branch) => ({
      label: branch.name,
      value: branch.id,
    })) || [];

  const [branchId, setBranchId] = useState(
    branchOptions.length > 0 ? branchOptions[0].value : ""
  );

  const invoiceQuery = useGetInvoices(data?.user?.email!, branchId);

  useEffect(() => {
    invoiceQuery.refetch();
  }, [branchId, invoiceQuery]);

  useEffect(() => {
    setBranchId(branchOptions[0]?.value || "");
  }, [branchQuery.data, branchOptions]);

  if (invoiceQuery.isLoading || branchQuery.isLoading) {
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
  }

  const invoiceData = invoiceQuery.data?.invoiceItems || [];

  return (
    <div className="max-w-screen-2xl mx-auto w-full -mt-24 pb-10">
      <Card>
        <CardHeader className="gap-y-2 lg:justify-between">
          <CardTitle className="text-xl line-clamp-1">
            Invoices {`(${invoiceData.length})`}
          </CardTitle>
          {branchOptions.length > 0 && (
            <Select
              defaultValue={branchOptions[0]?.value}
              onValueChange={(value) => setBranchId(value)}
            >
              <SelectTrigger className="w-fit">
                <SelectValue placeholder="Select a branch" />
              </SelectTrigger>
              <SelectContent>
                {branchOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={invoiceData} filterKey={"total"} />
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;
