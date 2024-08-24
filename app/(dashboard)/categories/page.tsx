import { Metadata } from "next";
import CategoriesPageClient from "./components/category-client";

export const metadata: Metadata = {
  title: "Categories | Invoicely",
  description:
    "Efficiently manage and organize your categories with Invoicely. Easily create, edit, and categorize your transactions, and use search and bulk operations for better oversight.",
};

const CategoriesPage = () => {
  return (
    <>
      <CategoriesPageClient />
    </>
  );
};

export default CategoriesPage;
