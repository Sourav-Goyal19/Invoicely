import { Suspense } from "react";
import { Metadata } from "next";
import SalesTransactionsPageClient from "./components/transactions-client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Sales Transactions | Invoicely",
  description:
    "Manage and generate PDF reports for your sales transactions with Invoicely. Create, edit, and view transactions, customize with branches and categories, and easily sort, search, and paginate through your financial history.",
};

const SalesTransactionsPage = () => {
  return (
    <Suspense fallback={<SalesTransactionsPageFallback />}>
      <SalesTransactionsPageClient />
    </Suspense>
  );
};

const SalesTransactionsPageFallback = () => {
  return (
    <div className="max-w-screen-2xl mx-auto w-full -mt-24 pb-10">
      <Card className="border-none drop-shadow-sm">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="h-[500px] w-full flex items-center justify-center">
            <Loader2 className="size-12 text-slate-300 animate-spin" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesTransactionsPage;
