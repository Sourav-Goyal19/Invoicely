"use client";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/hono";

export const useGetBranches = (email: string) => {
  const query = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await client.api[":email"].branches.$get({
        param: {
          email,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch branches");
      }
      const { data } = await res.json();
      return data;
    },
  });
  return query;
};
