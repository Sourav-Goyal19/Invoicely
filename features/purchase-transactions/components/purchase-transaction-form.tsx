import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/date-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Trash } from "lucide-react";
import { insertPurchaseTransactionsSchema } from "@/db/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { useState } from "react";
import { Select } from "@/components/select";

const formFields = z.object({
  date: z.coerce.date(),
  product: z.string().min(1, "Product Name is required").trim(),
  categoryId: z.string().nullable().optional(),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  price: z.coerce.number().min(1, "Price must be non-zero and non-negative"),
  total: z.coerce.number().min(0),
});

const apiSchema = insertPurchaseTransactionsSchema.omit({
  id: true,
  userId: true,
});

type FormValues = z.infer<typeof formFields>;
type ApiFormValues = z.infer<typeof apiSchema>;

interface PurchaseTransactionFormProps {
  id?: string;
  defaultValues?: FormValues;
  onSubmit: (values: ApiFormValues) => void;
  onDelete?: () => void;
  disabled?: boolean;
  onCreateBranch?: (name: string) => void;
  branchOptions: { label: string; value: string }[];
  onCreateCategory: (name: string) => void;
  categoryOptions: { label: string; value: string }[];
}

export const PurchaseTransactionForm: React.FC<
  PurchaseTransactionFormProps
> = ({
  id,
  defaultValues,
  onSubmit,
  onDelete,
  disabled,
  onCreateCategory,
  categoryOptions,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      date: new Date(),
      product: "",
      price: 0,
      quantity: 1,
      total: 0,

      ...defaultValues,
    },
    resolver: zodResolver(formFields),
  });

  const calculateTotal = (price: number, quantity: number) => {
    return Number((price * quantity).toFixed(2));
  };

  const updateGstAndTotal = () => {
    const price = form.getValues("price");
    const quantity = form.getValues("quantity");
    const total = calculateTotal(price, quantity);
    form.setValue("total", total);
  };

  const handleSubmit: SubmitHandler<FormValues> = async (data) => {
    console.log(data);
    onSubmit(data);
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      onDelete?.();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
              <FormLabel htmlFor="date">Date</FormLabel>
              <FormControl>
                <DatePicker
                  onChange={field.onChange}
                  value={field.value}
                  disabled={disabled || isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Select
                  placeholder="Select a category"
                  options={categoryOptions}
                  onChange={field.onChange}
                  onCreate={onCreateCategory}
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
              <FormLabel htmlFor="product">Product</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Item Name"
                  disabled={disabled || isSubmitting}
                  id="product"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  disabled={disabled || isSubmitting}
                  onChange={(e) => {
                    field.onChange(e);
                    updateGstAndTotal();
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="quantity">Quantity</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  placeholder="e.g. 1,2,3,4"
                  disabled={disabled || isSubmitting}
                  onChange={(e) => {
                    field.onChange(e);
                    updateGstAndTotal();
                  }}
                  id="quantity"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="total"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="total">Total</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  disabled
                  readOnly
                  id="total"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={disabled || isSubmitting}>
          {id ? "Save Changes" : "Create Transaction"}
        </Button>

        {!!id && (
          <Button
            type="button"
            variant="outline"
            disabled={disabled || isSubmitting}
            onClick={handleDelete}
            className="flex items-center justify-center w-full gap-2"
          >
            <Trash className="size-4 mr-2" />
            Delete Transaction
          </Button>
        )}
      </form>
    </Form>
  );
};
