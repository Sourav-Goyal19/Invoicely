"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  Row,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import React, { useState } from "react";
import { useConfirm } from "@/hooks/use-confirm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash, Upload } from "lucide-react";
import { useSelectCustomer } from "@/hooks/use-select-customer";
import { toast } from "sonner";
import { useCreateCustomerPdf } from "@/features/purchase-transactions/api/use-create-customer-pdf";
import { useSession } from "next-auth/react";
import { insertPurchaseTransactionsSchema } from "@/db/schema";
import { z } from "zod";
import LoadingModal from "./ui/loading-modal";
import { usePathname } from "next/navigation";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filterKey: string;
  onDelete?: (rows: Row<TData>[]) => void;
  disabled?: boolean;
}

const transactionSchema = insertPurchaseTransactionsSchema.omit({
  userId: true,
  id: true,
});

type transactionType = z.infer<typeof transactionSchema>;

export function DataTable<TData, TValue>({
  columns,
  data,
  filterKey,
  onDelete,
  disabled,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "You are about to perform a bulk delete"
  );

  const pathname = usePathname();

  const { data: authdata } = useSession();

  const customerPdfMutation = useCreateCustomerPdf(authdata?.user?.email!);

  const handleCustomerPdf = (
    customerName: string,
    branchId: string,
    GST: number,
    paymentType: string,
    transactions: transactionType[],
    date: Date
  ) => {
    setIsLoading(true);
    customerPdfMutation.mutate(
      {
        customerName,
        branchId,
        GST,
        paymentType,
        transactions,
        date,
      },
      {
        onSuccess: (data) => {
          setIsLoading(false);
          const url = URL.createObjectURL(data);
          const link = document.createElement("a");
          link.href = url;
          link.target = "_blank";
          // link.download = "invoice.pdf";
          table.resetRowSelection();
          link.click();
        },
        onError: (error) => {
          setIsLoading(false);
          toast.error(error.message);
        },
      }
    );
  };

  const [CustomerForm, customerConfirm] = useSelectCustomer();

  const [rowSelection, setRowSelection] = React.useState({});
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  return (
    <div>
      {isLoading && <LoadingModal />}
      <ConfirmDialog />
      <CustomerForm />
      <div className="flex flex-col md:flex-row items-center py-4 gap-4">
        <Input
          placeholder={`Filter ${filterKey}......`}
          value={(table.getColumn(filterKey)?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn(filterKey)?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <div className="flex flex-col w-full md:w-fit md:flex-row ml-0 md:ml-auto font-normal text-sm gap-3">
            <Button
              disabled={disabled}
              variant="outline"
              onClick={async () => {
                const ok = await confirm();
                if (ok) {
                  onDelete?.(table.getFilteredSelectedRowModel().rows);
                  table.resetRowSelection();
                }
              }}
              size="sm"
            >
              <Trash className="size-4 mr-2" />
              Delete ({table.getSelectedRowModel().rows.length})
            </Button>
            {pathname == "/sales-transactions" && (
              <Button
                size="sm"
                onClick={async () => {
                  const { customerName, branchId, GST, paymentType, date } =
                    await customerConfirm();
                  if (!customerName) {
                    return toast.error("Customer name is required");
                  }
                  if (!branchId) {
                    return toast.error("Branch Name is required");
                  }
                  if (!GST) {
                    return toast.error("GST is required");
                  }
                  if (!paymentType) {
                    return toast.error("Payment Type is required");
                  }

                  if (!date) {
                    return toast.error("Date is required");
                  }

                  const transactions = table
                    .getSelectedRowModel()
                    .rows.map((row) => ({
                      date: row.getValue("date") as Date,
                      product: row.getValue("product") as string,
                      quantity: row.getValue("quantity") as number,
                      price: row.getValue("price") as number,
                      total: row.getValue("total") as number,
                    }));
                  handleCustomerPdf(
                    customerName,
                    branchId,
                    GST,
                    paymentType,
                    transactions,
                    date
                  );
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                Export For Customer ({table.getSelectedRowModel().rows.length})
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
