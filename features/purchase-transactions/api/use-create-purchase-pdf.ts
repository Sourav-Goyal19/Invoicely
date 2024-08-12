import { client } from "@/lib/hono";
import { useMutation } from "@tanstack/react-query";
import { InferRequestType } from "hono";
import { toast } from "sonner";

type ResponseType = Blob;
type RequestType = InferRequestType<
  (typeof client.api)[":email"]["pdf"]["purchase"]["$post"]
>["json"];

export const useCreatePurchasePdf = (email: string) => {
  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api[":email"].pdf.purchase.$post({
        param: { email },
        json,
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = response.statusText;
        throw new Error(errorMessage);
      }
      return response.blob();
    },
    onSuccess: () => {
      toast.success("PDF created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create PDF");
    },
  });
};
