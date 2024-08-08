import { branchesTable, insertTransactionsSchema } from "@/db/schema";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { db } from "@/db/drizzle";
import { eq } from "drizzle-orm";

const transactionSchema = insertTransactionsSchema.omit({
  userId: true,
  id: true,
});

type transactionType = z.infer<typeof transactionSchema>;

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
          insertTransactionsSchema.omit({
            userId: true,
            id: true,
          })
        ),
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

      const pdfBuffer = generatePDFforCustomer(
        customerName,
        branchName,
        paymentType,
        GST,
        values.transactions
      );

      const pdfArrayBuffer = await pdfBuffer.arrayBuffer();
      const pdfUint8Array = new Uint8Array(pdfArrayBuffer);

      c.header("Content-Type", "application/pdf");
      c.header("Content-Disposition", "attachment; filename=invoice.pdf");

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
        transactions: z.array(
          insertTransactionsSchema.omit({
            userId: true,
            id: true,
          })
        ),
      })
    ),
    async (c) => {
      const values = c.req.valid("json");
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
      const SGSTPercent = GST / 2;
      const CGSTPercent = SGSTPercent;

      let total = values.transactions.reduce(
        (acc, curr) => acc + curr.total,
        0
      );

      const amountBeforeTax = calculateAmountBeforeGST(total, GST);

      const discountFactor = amountBeforeTax / total;

      const pdfBuffer = generatePDFforPurchase(
        branchName,
        paymentType,
        GST,
        values.transactions
      );

      const pdfArrayBuffer = await pdfBuffer.arrayBuffer();
      const pdfUint8Array = new Uint8Array(pdfArrayBuffer);

      c.header("Content-Type", "application/pdf");
      c.header("Content-Disposition", "attachment; filename=invoice.pdf");

      return c.body(pdfUint8Array);
    }
  );

const calculateAmountBeforeGST = (price: number, percent: number) => {
  if (!price || !percent) return 0;
  return Number((price / (1 + percent / 100)).toFixed(2));
};

const generatePDFforPurchase = (
  branchName: string,
  paymentType: string,
  GSTPercent: number,
  transactions: transactionType[]
): Blob => {
  const doc = new jsPDF();

  const addPageWithTransactions = (
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
    const textY = 30;

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
    doc.text("GSTIN: 07AJVPA2735N1ZS", 10, 40);
    doc.text("Mobile: 9871166715", 160, 40);

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(branchName, 105, 50, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(
      "490/1, Gurudwara Road, Kotla Mubarakpur, New Delhi - 110003",
      105,
      60,
      { align: "center" }
    );

    doc.setDrawColor(31, 31, 20);
    doc.setLineWidth(0.3);
    doc.line(10, 65, 200, 65);

    doc.setFontSize(12);
    doc.text(
      `M/s: ...................${paymentType}.....................................................................`,
      10,
      75
    );
    doc.text(
      `GSTIN No.: ......................................................................................`,
      10,
      85
    );

    doc.text("Invoice No.:", 150, 75);
    doc.text("Date .............................", 150, 85);

    doc.setDrawColor(31, 31, 20);
    doc.setLineWidth(0.3);
    doc.line(10, 93, 200, 93);

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
      startY: 100,
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

    doc.setFontSize(12);
    doc.text(
      `Shri ${branchName}`,
      doc.internal.pageSize.width - 15,
      doc.internal.pageSize.height - 50,
      { align: "right" }
    );
  };

  const chunkSize = 10;
  for (let i = 0; i < transactions.length; i += chunkSize) {
    const chunk = transactions.slice(i, i + chunkSize);
    addPageWithTransactions(chunk, Math.floor(i / chunkSize) + 1);
  }

  const pdfBlob = doc.output("blob");
  return pdfBlob;
};

const generatePDFforCustomer = (
  customerName: string,
  branchName: string,
  paymentType: string,
  GSTPercent: number,
  transactions: transactionType[]
): Blob => {
  const doc = new jsPDF();

  const addPageWithTransactions = (
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
    const textY = 30;

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
    doc.text("GSTIN: 07AJVPA2735N1ZS", 10, 40);
    doc.text("Mobile: 9871166715", 160, 40);

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(branchName, 105, 50, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(
      "490/1, Gurudwara Road, Kotla Mubarakpur, New Delhi - 110003",
      105,
      60,
      { align: "center" }
    );

    doc.setDrawColor(31, 31, 20);
    doc.setLineWidth(0.3);
    doc.line(10, 65, 200, 65);

    doc.setFontSize(12);
    doc.text(
      `M/s: ...................${paymentType}.....................................................................`,
      10,
      75
    );
    doc.text(
      `GSTIN No.: .............${customerName}..............................................................`,
      10,
      85
    );

    doc.text("Invoice No.:", 150, 75);
    doc.text("Date .............................", 150, 85);

    doc.setDrawColor(31, 31, 20);
    doc.setLineWidth(0.3);
    doc.line(10, 93, 200, 93);

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
      startY: 100,
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

    doc.setFontSize(12);
    doc.text(
      `Shri ${branchName}`,
      doc.internal.pageSize.width - 15,
      doc.internal.pageSize.height - 50,
      { align: "right" }
    );
  };

  const chunkSize = 10;
  for (let i = 0; i < transactions.length; i += chunkSize) {
    const chunk = transactions.slice(i, i + chunkSize);
    addPageWithTransactions(chunk, Math.floor(i / chunkSize) + 1);
  }

  const pdfBlob = doc.output("blob");
  return pdfBlob;
};

export default app;
