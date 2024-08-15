import { client } from "@/lib/hono";
import { useQuery } from "@tanstack/react-query";

export const useGetInvoices = (email: string, branchId: string) => {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const res = await client.api[":email"]["invoice"][":branchId"].$get({
        param: {
          branchId,
          email,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch invoices");
      }

      const { data } = await res.json();
      return data;
    },
  });
};
