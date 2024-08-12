import { InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api)[":email"]["purchase-transactions"][":id"]["$delete"]
>;

export const useDeletePurchaseTransaction = (id: string, email: string) => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error>({
    mutationFn: async () => {
      const response = await client.api[":email"]["purchase-transactions"][
        ":id"
      ].$delete({
        param: {
          id,
          email,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || response.statusText;
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Transaction deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["purchase-transactions"] });
      queryClient.invalidateQueries({
        queryKey: ["purchase-transaction", { id }],
      });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: (error) => {
      console.log(error);
      toast.error("Failed to delete transaction");
    },
  });
};
