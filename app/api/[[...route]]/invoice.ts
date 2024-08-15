import { db } from "@/db/drizzle";
import { invoiceItemTable, invoiceTable } from "@/db/schema";
import { zValidator } from "@hono/zod-validator";
import { desc, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

const app = new Hono().get(
  "/:branchId",
  zValidator(
    "param",
    z.object({
      branchId: z.string().uuid("Invalid Branch Id"),
      email: z.string().email("Invalid Email"),
    })
  ),
  async (c) => {
    const branchId = c.req.valid("param").branchId;

    const [invoice] = await db
      .select({
        id: invoiceTable.id,
        lastInvoiceNumber: invoiceTable.lastInvoiceNumber,
        branchId: invoiceTable.branchId,
      })
      .from(invoiceTable)
      .where(eq(invoiceTable.branchId, branchId));

    const invoiceItems = await db
      .select()
      .from(invoiceItemTable)
      .where(eq(invoiceItemTable.invoiceId, invoice.id))
      .orderBy(desc(invoiceItemTable.date));

    const data = { ...invoice, invoiceItems };

    return c.json({ data }, 200);
  }
);

export default app;
