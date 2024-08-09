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
import { useGetCategories } from "@/features/categories/api/use-get-categories";

interface CategoryFilterProps {
  user?: UserData | null;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ user }) => {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const categoryId = params.get("categoryId") || "all";
  const from = params.get("from") || "";
  const to = params.get("to") || "";

  const { data: categories, isLoading: categoryLoading } = useGetCategories(
    user?.email!
  );

  const onChange = (newValue: string) => {
    const query = {
      categoryId: newValue,
      from,
      to,
    };

    if (newValue == "all") {
      query.categoryId = "";
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

  if (categoryLoading) {
    return <Skeleton className="w-full lg:w-auto h-9 rounded-md" />;
  }

  return (
    <Select
      value={categoryId}
      onValueChange={onChange}
      disabled={categoryLoading}
    >
      <SelectTrigger className="w-full lg:w-auto h-9 rounded-md px-3 font-normal bg-white/10 hover:bg-white/20 hover:text-white border-none focus:ring-offset-0 focus:ring-transparent outline-none text-white focus:bg-white/30 transition">
        <SelectValue placeholder="Select Category" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all" className="font-medium">
          All Categories
        </SelectItem>
        {categories?.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
