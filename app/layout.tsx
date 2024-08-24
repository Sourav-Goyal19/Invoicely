import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NextAuthProvider from "./provider";
import { Toaster } from "react-hot-toast";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryProvider } from "@/providers/query-provider";
import SheetProvider from "@/providers/sheet-provider";
import { EdgeStoreProvider } from "@/lib/edgestore";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Invoicely",
  description:
    "Invoicely simplifies your GST billing and transaction management. Easily create and manage GST-compliant invoices, categorize products, and track financial transactions across multiple branches. Generate detailed PDF reports, find transactions that match specific totals, and streamline your business operations with our intuitive tools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthProvider>
          <QueryProvider>
            <EdgeStoreProvider>
              <SheetProvider />
              {children}
            </EdgeStoreProvider>
          </QueryProvider>
          <Toaster />
          <Sonner />
        </NextAuthProvider>
      </body>
    </html>
  );
}
