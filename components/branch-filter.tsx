"use client";

import { UserData } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import qs from "query-string";

import { useGetBranches } from "@/features/branches/api/use-get-branches";
import { useGetSummary } from "@/features/summary/api/use-get-summary";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface BranchFilterProps {
  user?: UserData | null;
}

export const BranchFilter: React.FC<BranchFilterProps> = ({ user }) => {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const branchId = params.get("branchId") || "all";
  const from = params.get("from") || "";
  const to = params.get("to") || "";

  const { data: branches, isLoading: branchesLoading } = useGetBranches(
    user?.email!
  );
  const { isLoading: summaryLoading } = useGetSummary(user?.email!);

  const onChange = (newValue: string) => {
    const query = {
      branchId: newValue,
      from,
      to,
    };

    if (newValue == "all") {
      query.branchId = "";
    }

    const url = qs.stringifyUrl(
      {
        url: pathname,
        query,
      },
      { skipEmptyString: true, skipNull: true }
    );

    router.push(url);
  };

  if (branchesLoading) {
    return <Skeleton className="w-full lg:w-auto h-9 rounded-md" />;
  }

  return (
    <Select
      value={branchId}
      onValueChange={onChange}
      disabled={branchesLoading || summaryLoading}
    >
      <SelectTrigger className="w-full lg:w-auto h-9 rounded-md px-3 font-normal bg-white/10 hover:bg-white/20 hover:text-white border-none focus:ring-offset-0 focus:ring-transparent outline-none text-white focus:bg-white/30 transition">
        <SelectValue placeholder="Select Branch" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Branches</SelectItem>
        {branches?.map((branch) => (
          <SelectItem key={branch.id} value={branch.id}>
            {branch.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
