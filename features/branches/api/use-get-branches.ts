"use client";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/hono";

export const useGetBranches = (email: string) => {
  return useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await client.api[":email"].branches.$get({
        param: {
          email,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch branches");
      }
      const { data } = await res.json();
      return data;
    },
  });
};
