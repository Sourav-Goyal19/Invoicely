"use client";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/hono";

export const useGetBranch = (id: string, email: string) => {
  const query = useQuery({
    enabled: !!id,
    queryKey: ["branch", { id }],
    queryFn: async () => {
      const res = await client.api[":email"].branches[":id"].$get({
        param: {
          email,
          id,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch branch");
      }
      const { data } = await res.json();
      return data;
    },
  });
  return query;
};
