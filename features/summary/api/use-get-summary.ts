import { client } from "@/lib/hono";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

export const useGetSummary = (email: string) => {
  const params = useSearchParams();
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const branchId = params.get("branchId") || "";
  const query = useQuery({
    queryKey: ["summary", { from, to, branchId }],
    queryFn: async () => {
      const response = await client.api[":email"].summary.$get({
        query: {
          from,
          to,
          branchId,
        },
        param: {
          email,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch summary");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
