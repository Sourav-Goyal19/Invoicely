import { z } from "zod";
import { Hono } from "hono";
import { db } from "@/db/drizzle";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { parse, subDays } from "date-fns";
import {
  purchaseTransactionsTable,
  insertPurchaseTransactionsSchema,
  usersTable,
  categoriesTable,
} from "@/db/schema";

const app = new Hono()
  .get(
    "/",
    zValidator(
      "param",
      z.object({
        email: z.string().email(),
      })
    ),
    zValidator(
      "query",
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
        categoryId: z.string().optional(),
      })
    ),
    async (ctx) => {
      const { from, to, categoryId } = ctx.req.valid("query");
      const email = ctx.req.valid("param").email;
      if (!email) {
        return ctx.json({ error: "Email Id is required" }, 400);
      }

      const defaultTo = new Date();
      const defaultFrom = subDays(defaultTo, 30);

      const endDate = to ? parse(to, "yyyy-MM-dd", new Date()) : defaultTo;

      const startDate = from
        ? parse(from, "yyyy-MM-dd", new Date())
        : defaultFrom;

      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));

      const data = await db
        .select({
          id: purchaseTransactionsTable.id,
          category: categoriesTable.name,
          categoryId: purchaseTransactionsTable.categoryId,
          date: purchaseTransactionsTable.date,
          product: purchaseTransactionsTable.product,
          price: purchaseTransactionsTable.price,
          quantity: purchaseTransactionsTable.quantity,
          total: purchaseTransactionsTable.total,
        })
        .from(purchaseTransactionsTable)
        .leftJoin(
          categoriesTable,
          eq(purchaseTransactionsTable.categoryId, categoriesTable.id)
        )
        .where(
          and(
            categoryId
              ? eq(purchaseTransactionsTable.categoryId, categoryId)
              : undefined,
            eq(purchaseTransactionsTable.userId, user.id),
            gte(purchaseTransactionsTable.date, startDate),
            lte(purchaseTransactionsTable.date, endDate)
          )
        )
        .orderBy(desc(purchaseTransactionsTable.date));

      const formattedData = data.map((item) => {
        return {
          ...item,
        };
      });

      return ctx.json({ data: formattedData }, 200);
    }
  )
  .get(
    "/:id",
    zValidator(
      "param",
      z.object({
        id: z.string().uuid().optional(),
        email: z.string().email(),
      })
    ),
    async (c) => {
      const id = c.req.valid("param").id;
      console.log(id);
      const email = c.req.valid("param").email;
      if (!id) {
        return c.json({ error: "Id is required" }, 400);
      }

      if (!email) {
        return c.json({ error: "Email Id is required" }, 400);
      }

      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));

      if (!user) {
        return c.json({ error: "User Not Found" }, 404);
      }

      const [data] = await db
        .select({
          id: purchaseTransactionsTable.id,
          category: categoriesTable.name,
          categoryId: purchaseTransactionsTable.categoryId,
          date: purchaseTransactionsTable.date,
          product: purchaseTransactionsTable.product,
          price: purchaseTransactionsTable.price,
          quantity: purchaseTransactionsTable.quantity,
          total: purchaseTransactionsTable.total,
        })
        .from(purchaseTransactionsTable)
        .leftJoin(
          categoriesTable,
          eq(purchaseTransactionsTable.categoryId, categoriesTable.id)
        )
        .where(
          and(
            eq(purchaseTransactionsTable.userId, user.id),
            eq(purchaseTransactionsTable.id, id)
          )
        );

      if (!data) {
        return c.json({ error: "Transaction Not Found" }, 404);
      }

      return c.json({ data }, 200);
    }
  )
  .post(
    "/",
    zValidator(
      "param",
      z.object({
        email: z.string().email(),
      })
    ),
    zValidator(
      "json",
      insertPurchaseTransactionsSchema.omit({
        id: true,
        userId: true,
      })
    ),
    async (c) => {
      const values = c.req.valid("json");
      const email = c.req.valid("param").email;

      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));

      if (!user) {
        return c.json({ error: "User Not Found" }, 400);
      }

      const [data] = await db
        .insert(purchaseTransactionsTable)
        .values({
          ...values,
          userId: user.id,
          price: values.price,
          quantity: values.quantity,
          product: values.product,
          total: values.total?.toString(),
        })
        .returning();

      return c.json({ data }, 201);
    }
  )
  .post(
    "/bulk-create",
    zValidator(
      "json",
      z.array(
        insertPurchaseTransactionsSchema.omit({
          id: true,
          userId: true,
        })
      )
    ),
    zValidator(
      "param",
      z.object({
        email: z.string().email(),
      })
    ),
    async (c) => {
      const values = c.req.valid("json");
      const email = c.req.valid("param").email;

      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));

      if (!user) {
        return c.json({ error: "User Not Found" }, 400);
      }

      const data = await db
        .insert(purchaseTransactionsTable)
        .values(
          values.map((v) => ({
            ...v,
            userId: user.id,
            price: v.price,
            quantity: v.quantity,
            product: v.product,
            total: v.total?.toString(),
          }))
        )
        .returning();

      return c.json({ data }, 201);
    }
  )
  .post(
    "/bulk-delete",
    zValidator(
      "param",
      z.object({
        email: z.string().email(),
      })
    ),
    zValidator(
      "json",
      z.object({
        ids: z.array(z.string().uuid()),
      })
    ),
    async (c) => {
      const values = c.req.valid("json");
      const email = c.req.valid("param").email;
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));

      if (!user) {
        return c.json({ error: "User Not Found" }, 404);
      }

      const transactionsToDelete = db.$with("transactions_to_delete").as(
        db
          .select({
            id: purchaseTransactionsTable.id,
          })
          .from(purchaseTransactionsTable)
          .where(
            and(
              eq(purchaseTransactionsTable.userId, user.id),
              inArray(purchaseTransactionsTable.id, values.ids)
            )
          )
      );

      const data = await db
        .with(transactionsToDelete)
        .delete(purchaseTransactionsTable)
        .where(
          inArray(
            purchaseTransactionsTable.id,
            sql`(select id from ${transactionsToDelete})`
          )
        )
        .returning();

      return c.json({ data }, 200);
    }
  )
  .patch(
    "/:id",
    zValidator(
      "param",
      z.object({
        id: z.string().uuid("Invalid Transaction Id").optional(),
        email: z.string().email(),
      })
    ),
    zValidator(
      "json",
      insertPurchaseTransactionsSchema.omit({
        id: true,
        userId: true,
      })
    ),
    async (c) => {
      const id = c.req.valid("param").id;
      const email = c.req.valid("param").email;
      const values = c.req.valid("json");

      if (!id) {
        return c.json({ error: "Transaction id is required" }, 400);
      }

      if (!email) {
        return c.json({ error: "Email Id is required" }, 400);
      }

      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));

      if (!user) {
        return c.json({ error: "User Not Found" }, 404);
      }

      const transactionsToUpdate = db.$with("transactions_to_update").as(
        db
          .select({
            id: purchaseTransactionsTable.id,
          })
          .from(purchaseTransactionsTable)
          .where(
            and(
              eq(purchaseTransactionsTable.id, id),
              eq(purchaseTransactionsTable.userId, user.id)
            )
          )
      );

      const [data] = await db
        .with(transactionsToUpdate)
        .update(purchaseTransactionsTable)
        .set({
          ...values,
          userId: user.id,
          price: values.price,
          quantity: values.quantity,
          product: values.product,
          total: values.total?.toString(),
        })
        .where(
          inArray(
            purchaseTransactionsTable.id,
            sql`(select id from ${transactionsToUpdate})`
          )
        )
        .returning();

      if (!data) {
        return c.json({ error: "Transaction Not Found" }, 404);
      }

      return c.json({ data }, 200);
    }
  )
  .delete(
    "/:id",
    zValidator(
      "param",
      z.object({
        id: z.string().uuid("Invalid Transaction Id").optional(),
        email: z.string().email(),
      })
    ),
    async (c) => {
      const id = c.req.valid("param").id;
      const email = c.req.valid("param").email;

      if (!id) {
        return c.json({ error: "Transaction id is required" }, 400);
      }

      if (!email) {
        return c.json({ error: "Email Id is required" }, 400);
      }

      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));

      if (!user) {
        return c.json({ error: "User Not Found" }, 404);
      }

      const transactionToDelete = db.$with("transaction_to_delete").as(
        db
          .select({
            id: purchaseTransactionsTable.id,
          })
          .from(purchaseTransactionsTable)
          .where(
            and(
              eq(purchaseTransactionsTable.id, id),
              eq(purchaseTransactionsTable.userId, user.id)
            )
          )
      );

      const [data] = await db
        .with(transactionToDelete)
        .delete(purchaseTransactionsTable)
        .where(
          inArray(
            purchaseTransactionsTable.id,
            sql`(select id from ${transactionToDelete})`
          )
        )
        .returning();

      if (!data) {
        return c.json({ error: "Transaction Not Found" }, 404);
      }

      return c.json({ data }, 200);
    }
  );

export default app;
