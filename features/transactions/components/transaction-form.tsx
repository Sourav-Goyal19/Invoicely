import { Select } from "@/components/select";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Select as ShadcnSelect,
} from "@/components/ui/select";
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
import { insertTransactionsSchema } from "@/db/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

const formFields = z.object({
  date: z.coerce.date(),
  branchId: z.string().trim(),
  product: z.string().min(1, "Product Name is required").trim(),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  price: z.coerce.number().min(0, "Price must be non-negative"),
  cgstPercent: z.coerce.number().min(0).max(100),
  sgstPercent: z.coerce.number().min(0).max(100),
  cgstAmount: z.coerce.number().min(0),
  sgstAmount: z.coerce.number().min(0),
  paymentType: z.string(),
  total: z.coerce.number().min(0),
});

const apiSchema = insertTransactionsSchema.omit({
  id: true,
  userId: true,
});

type FormValues = z.infer<typeof formFields>;
type ApiFormValues = z.infer<typeof apiSchema>;

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
  const [checked, setChecked] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      date: new Date(),
      branchId: "",
      product: "",
      price: 0,
      quantity: 1,
      sgstPercent: 0,
      cgstPercent: 0,
      sgstAmount: 0,
      cgstAmount: 0,
      paymentType: "cash",
      total: 0,

      ...defaultValues,
    },
    resolver: zodResolver(formFields),
  });

  // const calculateGstAmounts = (price: number, percent: number) => {
  //   return Number(((price * percent) / 100).toFixed(2));
  // };

  const calculateGstAmounts = (price: number, percent: number) => {
    if (!price || !percent) return 0;
    const baseAmount = price / (1 + percent / 100);
    return Number(((baseAmount * percent) / 100).toFixed(2));
  };

  const calculateTotal = (price: number, quantity: number) => {
    return Number((price * quantity).toFixed(2));
  };

  const updateGstAndTotal = () => {
    const price = form.getValues("price");
    const quantity = form.getValues("quantity");
    const sgstPercent = form.getValues("sgstPercent");
    const cgstPercent = form.getValues("cgstPercent");

    const sgstAmount = calculateGstAmounts(price, sgstPercent);
    const cgstAmount = calculateGstAmounts(price, cgstPercent);
    const total = calculateTotal(price, quantity);

    form.setValue("sgstAmount", sgstAmount);
    form.setValue("cgstAmount", cgstAmount);
    form.setValue("total", total);
  };

  const handleSubmit: SubmitHandler<FormValues> = async (data) => {
    //   setIsSubmitting(true);
    console.log(data);
    onSubmit(data);
    // try {
    //   await onSubmit(data);
    // } catch (error) {
    //   console.error("Error submitting form:", error);
    // } finally {
    //   setIsSubmitting(false);
    // }
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
          name="branchId"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="branch">Branch</FormLabel>
              <FormControl>
                <Select
                  placeholder="Select a branch"
                  options={branchOptions}
                  onChange={field.onChange}
                  onCreate={onCreateBranch}
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
          name="paymentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="branch">Branch</FormLabel>
              <FormControl>
                <ShadcnSelect
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank</SelectItem>
                  </SelectContent>
                </ShadcnSelect>
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
          name="sgstPercent"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="sgstPercent">SGST Percent</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="0.01"
                  placeholder="e.g. 2.5%"
                  disabled={disabled || isSubmitting}
                  onChange={(e) => {
                    field.onChange(e);
                    if (checked) {
                      form.setValue("cgstPercent", parseFloat(e.target.value));
                    }
                    updateGstAndTotal();
                  }}
                  id="sgstPercent"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cgstPercent"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="cgstPercent">CGST Percent</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="0.01"
                  placeholder="e.g. 2.5%"
                  disabled={disabled || isSubmitting}
                  onChange={(e) => {
                    field.onChange(e);
                    setChecked(
                      form.getValues("cgstPercent") ===
                        form.getValues("sgstPercent")
                    );
                    updateGstAndTotal();
                  }}
                  id="cgstPercent"
                />
              </FormControl>
              <div className="flex items-center gap-2 ml-1">
                <Checkbox
                  id="sameAssgst"
                  disabled={disabled || isSubmitting}
                  checked={checked}
                  onCheckedChange={(value) => {
                    const isChecked = value === true;
                    setChecked(isChecked);
                    if (isChecked) {
                      const sgstValue = form.getValues("sgstPercent");
                      form.setValue("cgstPercent", sgstValue);
                      updateGstAndTotal();
                    }
                  }}
                />
                <label htmlFor="sameAssgst" className="text-sm text-gray-600">
                  Same as SGST Percent
                </label>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sgstAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="sgstAmount">SGST Amount</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  disabled
                  readOnly
                  id="sgstAmount"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cgstAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="cgstAmount">CGST Amount</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  disabled
                  readOnly
                  id="cgstAmount"
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
