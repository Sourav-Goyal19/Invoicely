import { type ClassValue, clsx } from "clsx";
import { eachDayOfInterval, format, isSameDay, subDays } from "date-fns";
import { twMerge } from "tailwind-merge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { insertPurchaseTransactionsSchema } from "@/db/schema";
import { z } from "zod";

const transactionSchema = insertPurchaseTransactionsSchema.omit({
  userId: true,
  id: true,
});

type transactionType = z.infer<typeof transactionSchema>;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertPriceFromMiliunits(amount: number) {
  return amount / 1000;
}

export function convertPriceToMiliunits(amount: number) {
  return Math.round(amount * 1000);
}

const generatePDF = (
  branchName: string,
  customerName: string,
  paymentType: string,
  SGSTPercent: number,
  CGSTPercent: number,
  SGST: number,
  CGST: number,
  amountBeforeTax: number,
  transactions: transactionType[],
  total: number
): Blob => {
  const doc = new jsPDF();

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
    `M/s: ...................${paymentType}..................................................................................`,
    10,
    75
  );
  doc.text(
    `GSTIN No.: ...........${customerName}..............................................................................`,
    10,
    85
  );

  doc.text("Invoice No.:", 150, 75);
  doc.text("Date .............................", 150, 85);

  doc.setDrawColor(31, 31, 20);
  doc.setLineWidth(0.3);
  doc.line(10, 93, 200, 93);

  const tableBody = transactions.map((transaction, index) => [
    index + 1,
    transaction.product || "N/A",
    `Rs ${transaction.price.toFixed(2)}`,
    transaction.quantity,
    `Rs ${transaction.total.toFixed(2)}`,
  ]);

  if (transactions.length < 10) {
    for (let i = transactions.length; i < 10; i++) {
      tableBody.push([i + 1, "", "_", "_", "_"]);
    }
  }

  tableBody.push(
    [
      "",
      "Total Sale Value before adding GST",
      "",
      "",
      `Rs ${amountBeforeTax.toFixed(2)}`,
    ],
    ["", "", "@SGST", `${SGSTPercent}%`, `Rs ${SGST.toFixed(2)}`],
    ["", "", "@CGST", `${CGSTPercent}%`, `Rs ${CGST.toFixed(2)}`],
    ["", "Total Sale Price with GST", "", "", `Rs ${total.toFixed(2)}`]
  );

  autoTable(doc, {
    startY: 100,
    head: [["Item", "Description of Goods", "Rate", "Quantity", "Amount"]],
    body: tableBody,
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
        { row: tableBody.length - 4, col: 1 },
        { row: tableBody.length - 3, col: 2 },
        { row: tableBody.length - 2, col: 2 },
        { row: tableBody.length - 1, col: 1 },
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

  const pdfBlob = doc.output("blob");
  return pdfBlob;
};

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);
}

export function calculatePercentageChange(current: number, previous: number) {
  if (previous === 0) {
    return previous == current ? 0 : 100;
  }
  return parseFloat((((current - previous) / previous) * 100).toFixed(2));
}

export function fillMissingDays(
  activeDays: {
    date: Date;
    income: number;
    expenses: number;
  }[],
  startDate: Date,
  endDate: Date
) {
  if (activeDays.length == 0) return [];

  const alldays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const transactionsByDay = alldays.map((day) => {
    const found = activeDays.find((d) => isSameDay(d.date, day));

    if (found) {
      return found;
    } else {
      return {
        date: day,
        income: 0,
        expenses: 0,
      };
    }
  });

  return transactionsByDay;
}

export function formatDateRange({
  from,
  to,
}: {
  from: string | Date | undefined;
  to: string | Date | undefined;
}) {
  const defaultTo = new Date();
  const defaultFrom = subDays(defaultTo, 30);

  if (!from) {
    return `${format(defaultFrom, "LLL dd")} - ${format(
      defaultTo,
      "LLL dd, y"
    )}`;
  }

  if (to) {
    return `${format(from, "LLL dd")} - ${format(to, "LLL dd, y")}`;
  }

  return format(from, "LLL dd, y");
}

export function formatPercentage(
  value: number,
  options: { addPrefix?: boolean } = { addPrefix: false }
) {
  const result = new Intl.NumberFormat("en-IN", {
    style: "percent",
    minimumFractionDigits: 2,
  }).format(value / 100);

  if (options.addPrefix && value > 0) {
    return `+${result}`;
  }

  return result;
}
