import { Select } from "@/components/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/date-picker";
import { AmountInput } from "@/components/amount-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Trash } from "lucide-react";

import { insertTransactionsSchema } from "@/db/schema";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";

const formFields = z.object({
  date: z.coerce.date(),
  branchId: z.string().trim(),
  product: z.string().trim(),
  amount: z.string().trim(),
});

const apiSchema = insertTransactionsSchema.omit({
  id: true,
  userId: true,
});

type FormValues = z.input<typeof formFields>;
type ApiFormValues = z.input<typeof apiSchema>;

interface TransactionFormProps {
  id?: string;
  defaultValues?: FormValues;
  onSubmit: (values: ApiFormValues) => void;
  onDelete?: () => void;
  disabled?: boolean;
  branchOptions: { label: string; value: string }[];
  onCreateBranch: (name: string) => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  id,
  defaultValues,
  onSubmit,
  onDelete,
  disabled,
  branchOptions,
  onCreateBranch,
}) => {
  const form = useForm<FormValues>({
    defaultValues: defaultValues,
    resolver: zodResolver(formFields),
  });

  const handleSubmit: SubmitHandler<FormValues> = (data) => {
    console.log(data);
    const amount = parseFloat(data.amount);
    onSubmit({ ...data, amount });
  };

  const handleDelete = () => {
    onDelete?.();
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-4 pt-2"
        >
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <DatePicker
                    onChange={field.onChange}
                    value={field.value}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="branchId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Branch</FormLabel>
                <FormControl>
                  <Select
                    placeholder="Select a branch"
                    options={branchOptions}
                    onChange={field.onChange}
                    onCreate={onCreateBranch}
                    value={field.value}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="product"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Add a product"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <AmountInput
                    {...field}
                    placeholder="0.00"
                    disabled={disabled}
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={disabled}>
            {id ? "Save Changes" : "Create Transaction"}
          </Button>
          {!!id && (
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={handleDelete}
              className="flex items-center justify-center w-full gap-2"
            >
              <Trash className="size-4 mr-2" />
              Delete Transaction
            </Button>
          )}
        </form>
      </Form>
    </>
  );
};
