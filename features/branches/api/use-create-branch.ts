import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api)[":email"]["branches"]["$post"]
>;
type RequestType = InferRequestType<
  (typeof client.api)[":email"]["branches"]["$post"]
>["json"];

export const useCreateBranch = (email: string) => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api[":email"].branches.$post({
        json,
        param: {
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
      toast.success("Branch created successfully");
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create branch");
    },
  });
};
