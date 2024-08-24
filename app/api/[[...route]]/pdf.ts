import {
  branchesTable,
  categoriesTable,
  insertPurchaseTransactionsSchema,
  invoiceItemTable,
  invoiceTable,
  purchaseTransactionsTable,
  usersTable,
} from "@/db/schema";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { db } from "@/db/drizzle";
import { and, eq, gt, inArray, lte } from "drizzle-orm";
import { format } from "date-fns";

const transactionSchema = insertPurchaseTransactionsSchema.omit({
  userId: true,
  id: true,
});

type transactionType = z.infer<typeof transactionSchema>;

interface Transaction {
  date: Date;
  id: string;
  price: number;
  product: string;
  quantity: number;
  total: string;
  userId: string;
  categoryId: string | null;
}

const app = new Hono()
  .post(
    "/customer",
    zValidator(
      "param",
      z.object({
        email: z.string().email(),
      })
    ),
    zValidator(
      "json",
      z.object({
        customerName: z.string().min(1, "Customer name is required"),
        branchId: z.string().uuid("Invalid branch Id"),
        GST: z.coerce
          .number()
          .min(0, "GST must be greater than or equal to zero"),
        paymentType: z.string().min(1, "Payment Type is required"),
        transactions: z.array(
          insertPurchaseTransactionsSchema.omit({
            userId: true,
            id: true,
          })
        ),
        date: z.coerce.date(),
      })
    ),
    async (c) => {
      const values = c.req.valid("json");
      const customerName = values.customerName;
      const paymentType = values.paymentType;

      const [branch] = await db
        .select()
        .from(branchesTable)
        .where(eq(branchesTable.id, values.branchId));

      if (!branch) {
        return c.json(
          {
            error: "Branch not found",
          },
          404
        );
      }
      const branchName = branch.name;
      const GST = values.GST;
      const formattedDate = format(values.date, "dd/MM/yyyy");
      const formattedDateForFilename = format(values.date, "yyyyMMdd");

      const pdfBuffer = await generatePDF(
        branchName,
        paymentType,
        GST,
        values.transactions,
        branch.address,
        branch.phone,
        branch.gstNo,
        formattedDate,
        undefined,
        branch.signatureImageUrl,
        customerName
      );

      const pdfArrayBuffer = await pdfBuffer.arrayBuffer();
      const pdfUint8Array = new Uint8Array(pdfArrayBuffer);

      c.header("Content-Type", "application/pdf");

      const filename = `invoice-${""}-${formattedDateForFilename || ""}.pdf`;
      c.header("Content-Disposition", `attachment; filename=${filename}`);

      return c.body(pdfUint8Array);
    }
  )
  .post(
    "/purchase",
    zValidator(
      "param",
      z.object({
        email: z.string().email(),
      })
    ),
    zValidator(
      "json",
      z.object({
        branchId: z.string().uuid("Invalid branch Id"),
        GST: z.coerce
          .number()
          .min(0, "GST must be greater than or equal to zero"),
        paymentType: z.string().min(1, "Payment Type is required"),
        categoryIds: z.array(z.string().uuid("Invalid category Id")),
        totalAmount: z.coerce.number(),
        date: z.coerce.date(),
      })
    ),
    async (c) => {
      const values = c.req.valid("json");
      const paymentType = values.paymentType;
      const categoryIds = values.categoryIds;
      const totalAmount = values.totalAmount;
      const email = c.req.valid("param").email;
      const date = values.date;

      const [user] = await db
        .select({
          id: usersTable.id,
        })
        .from(usersTable)
        .where(eq(usersTable.email, email));

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      const [branch] = await db
        .select()
        .from(branchesTable)
        .where(eq(branchesTable.id, values.branchId));

      if (!branch) {
        return c.json(
          {
            error: "Branch not found",
          },
          404
        );
      }

      const categories = await db
        .select()
        .from(categoriesTable)
        .where(inArray(categoriesTable.id, categoryIds));

      if (categories.length <= 0) {
        return c.json({ error: "No Categories Found" }, 404);
      }

      const transactions = await db
        .select()
        .from(purchaseTransactionsTable)
        .where(
          and(
            inArray(purchaseTransactionsTable.categoryId, categoryIds),
            eq(purchaseTransactionsTable.userId, user.id),
            gt(purchaseTransactionsTable.quantity, 0)
          )
        );

      const finalTransactions = findMatchingTransactions(
        transactions,
        totalAmount
      );

      if (!finalTransactions || finalTransactions.length === 0) {
        return c.json({ error: "No matching transactions found" }, 404);
      }

      for (const transactiontoUpdate of finalTransactions) {
        const [existingTransaction] = await db
          .select()
          .from(purchaseTransactionsTable)
          .where(eq(purchaseTransactionsTable.id, transactiontoUpdate.id));

        const newQuantity =
          existingTransaction.quantity - transactiontoUpdate.quantity;

        await db
          .update(purchaseTransactionsTable)
          .set({
            quantity: newQuantity,
            total: String(transactiontoUpdate.price * newQuantity),
          })
          .where(eq(purchaseTransactionsTable.id, transactiontoUpdate.id));
      }

      const [invoice] = await db
        .select()
        .from(invoiceTable)
        .where(eq(invoiceTable.branchId, branch.id));

      const [newInvoiceItem] = await db
        .insert(invoiceItemTable)
        .values({
          invoiceId: invoice.id,
          date: date,
          invoiceNumber: invoice.lastInvoiceNumber + 1,
          total: totalAmount.toString(),
          userId: user.id,
          branchId: branch.id,
        })
        .returning();

      if (!newInvoiceItem) {
        return c.json({ error: "Error creating invoice" }, 500);
      }

      await db.update(invoiceTable).set({
        lastInvoiceNumber: invoice.lastInvoiceNumber + 1,
      });

      const formattedDate = format(date, "dd/MM/yyyy");
      const formattedDateForFilename = format(date, "yyyyMMdd");
      const branchName = branch.name;
      const GST = values.GST;

      const formattedFinalTransactions = finalTransactions.map(
        (transaction) => ({
          ...transaction,
          total: parseFloat(transaction.total),
        })
      );

      const pdfBuffer = await generatePDF(
        branchName,
        paymentType,
        GST,
        formattedFinalTransactions,
        branch.address,
        branch.phone,
        branch.gstNo,
        formattedDate,
        newInvoiceItem.invoiceNumber,
        branch.signatureImageUrl,
        undefined
      );

      const pdfArrayBuffer = await pdfBuffer.arrayBuffer();
      const pdfUint8Array = new Uint8Array(pdfArrayBuffer);

      c.header("Content-Type", "application/pdf");
      const filename = `invoice-${newInvoiceItem.invoiceNumber || ""}-${
        formattedDateForFilename || ""
      }.pdf`;
      c.header("Content-Disposition", `attachment; filename=${filename}`);

      return c.body(pdfUint8Array);
    }
  );

const calculateAmountBeforeGST = (price: number, percent: number) => {
  if (!price || !percent) return 0;
  return Number((price / (1 + percent / 100)).toFixed(2));
};

function findMatchingTransactions(
  transactions: Transaction[],
  targetAmount: number
): Transaction[] | null {
  function backtrack(
    startIndex: number,
    currentAmount: number,
    currentTransactions: Transaction[]
  ): Transaction[] | null {
    if (currentAmount === targetAmount) {
      return currentTransactions;
    }

    if (currentAmount > targetAmount || startIndex === transactions.length) {
      return null;
    }

    for (let i = startIndex; i < transactions.length; i++) {
      const transaction = transactions[i];
      const totalValue = parseFloat(transaction.total);

      for (let q = 1; q <= transaction.quantity; q++) {
        const newTotal =
          currentAmount + totalValue * (q / transaction.quantity);

        if (newTotal > targetAmount) break;

        const result = backtrack(
          i + 1,
          newTotal,
          currentTransactions.concat({
            ...transaction,
            quantity: q,
            total: (totalValue * (q / transaction.quantity)).toFixed(2),
          })
        );

        if (result) return result;
      }
    }

    return null;
  }

  return backtrack(0, 0, []) || null;
}

const generatePDF = async (
  branchName: string,
  paymentType: string,
  GSTPercent: number,
  transactions: transactionType[],
  address: string,
  mobileNumber: string,
  gst_no: string | null,
  date?: string,
  invoiceNumber?: number,
  signatureImageUrl?: string | null,
  customerName?: string
): Promise<Blob> => {
  const doc = new jsPDF();

  const addSignatureImage = (signatureImageUrl: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";

      img.onload = function () {
        const imgWidth = 50;
        const imgHeight = 20;
        const x = doc.internal.pageSize.width - 15;
        const y = doc.internal.pageSize.height - imgHeight - 10;

        doc.addImage(img, "JPEG", x, y, imgWidth, imgHeight);
        resolve();
      };

      img.onerror = () => reject(new Error("Failed to load image"));

      img.src = signatureImageUrl;
    });
  };

  const addPageWithTransactions = async (
    transactions: transactionType[],
    pageNumber: number
  ) => {
    if (pageNumber > 1) {
      doc.addPage();
    }

    doc.setFontSize(16);
    const text = "Tax Invoice";
    const textWidth = doc.getTextWidth(text);
    const textX = 105;
    const textY = 20;

    doc.text(text, textX, textY, { align: "center" });

    const underlineY = textY + 0.7;
    doc.setLineWidth(0.3);
    doc.line(
      textX - textWidth / 2,
      underlineY,
      textX + textWidth / 2,
      underlineY
    );

    doc.setFontSize(12);
    doc.text(`GSTIN: ${gst_no}`, 10, 30);
    doc.text(`Mobile: ${mobileNumber}`, 160, 30);

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(branchName, 105, 43, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(address, 105, 50, { align: "center" });

    doc.setDrawColor(31, 31, 20);
    doc.setLineWidth(0.3);
    doc.line(10, 55, 200, 55);

    doc.setFontSize(15);
    doc.text(`M/s: ${paymentType}`, 10, 65);

    doc.setFontSize(12);
    doc.text(
      `GSTIN No.: ................${
        customerName ? customerName : ""
      }................................................`,
      10,
      75
    );
    doc.text(`Invoice No.: ${invoiceNumber ? invoiceNumber : ""}`, 150, 65);

    doc.text(`Date :${date ? date : ""}`, 150, 75);

    doc.setDrawColor(31, 31, 20);
    doc.setLineWidth(0.3);
    doc.line(10, 83, 200, 83);

    const pageTotal = transactions.reduce((acc, curr) => acc + curr.total, 0);

    const amountBeforeTax = calculateAmountBeforeGST(pageTotal, GSTPercent);

    const discountFactor = amountBeforeTax / pageTotal;

    const SGST = amountBeforeTax * (GSTPercent / 2 / 100);
    const CGST = amountBeforeTax * (GSTPercent / 2 / 100);

    const formattedTransactions = transactions.map((transaction) => ({
      ...transaction,
      price: transaction.price * discountFactor,
      total: transaction.total * discountFactor,
    }));

    const pageTransactions = formattedTransactions.map((transaction, index) => [
      index + 1,
      transaction.product || "N/A",
      `Rs ${transaction.price.toFixed(2)}`,
      transaction.quantity,
      `Rs ${transaction.total.toFixed(2)}`,
    ]);

    if (transactions.length < 10) {
      for (let i = transactions.length; i < 10; i++) {
        pageTransactions.push([i + 1, "", "_", "_", "_"]);
      }
    }

    pageTransactions.push(
      [
        "",
        "Total Sale Value before adding GST",
        "",
        "",
        `Rs ${amountBeforeTax.toFixed(2)}`,
      ],
      ["", "", "@SGST", `${GSTPercent / 2}%`, `Rs ${SGST.toFixed(2)}`],
      ["", "", "@CGST", `${GSTPercent / 2}%`, `Rs ${CGST.toFixed(2)}`],
      ["", "Total Sale Price with GST", "", "", `Rs ${pageTotal.toFixed(2)}`]
    );

    autoTable(doc, {
      startY: 90,
      head: [["Item", "Description of Goods", "Rate", "Quantity", "Amount"]],
      body: pageTransactions,
      theme: "plain",
      styles: {
        fontSize: 11,
        cellPadding: 2,
        lineWidth: 0.2,
        lineColor: [214, 214, 194],
        fontStyle: "normal",
      },
      headStyles: {
        fillColor: undefined,
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
      bodyStyles: {
        fillColor: undefined,
        textColor: [0, 0, 0],
      },
      columnStyles: {
        0: { fontStyle: "normal" },
        1: { fontStyle: "normal" },
        2: { fontStyle: "normal" },
        3: { fontStyle: "normal" },
        4: { fontStyle: "normal" },
      },
      didParseCell: function (data) {
        const boldCells = [
          { row: pageTransactions.length - 4, col: 1 },
          { row: pageTransactions.length - 3, col: 2 },
          { row: pageTransactions.length - 2, col: 2 },
          { row: pageTransactions.length - 1, col: 1 },
        ];
        boldCells.forEach((cell) => {
          if (data.row.index === cell.row && data.column.index === cell.col) {
            data.cell.styles.fontStyle = "bold";
          }
        });
      },
    });

    if (signatureImageUrl) {
      try {
        await addSignatureImage(signatureImageUrl);
      } catch (error) {
        console.error("Failed to add signature image:", error);
      }
    }

    doc.setFontSize(12);
    doc.text(
      `${branchName}`,
      doc.internal.pageSize.width - 15,
      doc.internal.pageSize.height - 20,
      { align: "right" }
    );
  };

  const chunkSize = 10;
  for (let i = 0; i < transactions.length; i += chunkSize) {
    const chunk = transactions.slice(i, i + chunkSize);
    await addPageWithTransactions(chunk, Math.floor(i / chunkSize) + 1);
  }

  const pdfBlob = doc.output("blob");
  return pdfBlob;
};

export default app;
