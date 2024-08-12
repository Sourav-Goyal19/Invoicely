"use client";
import { client } from "@/lib/hono";
import { useQuery } from "@tanstack/react-query";

export const useGetPurchaseTransaction = (id: string, email: string) => {
  const query = useQuery({
    enabled: !!id,
    queryKey: ["purchase-transaction", { id }],
    queryFn: async () => {
      const res = await client.api[":email"]["purchase-transactions"][
        ":id"
      ].$get({
        param: {
          email,
          id,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch transaction");
      }
      const { data } = await res.json();
      return data;
    },
  });
  return query;
};
