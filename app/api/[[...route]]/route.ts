import { Hono } from "hono";
import { handle } from "hono/vercel";
import { HTTPException } from "hono/http-exception";

import BranchRouter from "./branches";
import PurchaseTransactionsRouter from "./purchase-transactions";
import SalesTransactionsRouter from "./sales-transactions";
import SummaryRouter from "./summary";
import PdfRouter from "./pdf";
import CategoryRouter from "./categories";
import InvoiceRouter from "./invoice";

export const runtime = "edge";

const app = new Hono().basePath("/api");

app.onError((err, ctx) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  return ctx.json({ error: err.message }, 500);
});

const routes = app
  .route("/:email/summary", SummaryRouter)
  .route("/:email/branches", BranchRouter)
  .route("/:email/categories", CategoryRouter)
  .route("/:email/purchase-transactions", PurchaseTransactionsRouter)
  .route("/:email/sales-transactions", SalesTransactionsRouter)
  .route("/:email/pdf", PdfRouter)
  .route("/:email/invoice", InvoiceRouter);

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);

export type AppType = typeof routes;
