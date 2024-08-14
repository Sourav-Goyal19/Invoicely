import { z } from "zod";
import { Hono } from "hono";
import { db } from "@/db/drizzle";
import { and, eq, inArray } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { validate as validateUUId } from "uuid";
import {
  branchesTable,
  insertBranchSchema,
  invoiceTable,
  usersTable,
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
    async (ctx) => {
      const email = ctx.req.valid("param").email;
      if (!email) {
        return ctx.json({ error: "Email Id is required" }, 400);
      }

      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));

      const data = await db
        .select({
          id: branchesTable.id,
          name: branchesTable.name,
          address: branchesTable.address,
          phone: branchesTable.phone,
          gstNo: branchesTable.gstNo,
        })
        .from(branchesTable)
        .where(eq(branchesTable.userId, user.id));

      if (data.length <= 0) {
        return ctx.json({ error: "Branches Not Found" }, 404);
      }

      return ctx.json({ data }, 200);
    }
  )
  .get(
    "/:id",
    zValidator(
      "param",
      z.object({
        id: z.string().optional(),
        email: z.string().email(),
      })
    ),
    async (c) => {
      const id = c.req.valid("param").id;
      const email = c.req.valid("param").email;
      if (!id) {
        return c.json({ error: "Id is required" }, 400);
      }

      if (!validateUUId(id)) {
        return c.json({ error: "Invalid Id" }, 400);
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
          id: branchesTable.id,
          name: branchesTable.name,
          address: branchesTable.address,
          phone: branchesTable.phone,
          gstNo: branchesTable.gstNo,
        })
        .from(branchesTable)
        .where(
          and(eq(branchesTable.userId, user.id), eq(branchesTable.id, id))
        );

      if (!data) {
        return c.json({ error: "branch Not Found" }, 404);
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
      insertBranchSchema.pick({
        name: true,
        address: true,
        phone: true,
        gstNo: true,
      })
    ),
    async (c) => {
      const { name, address, phone, gstNo } = c.req.valid("json");
      const email = c.req.valid("param").email;

      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));

      if (!user) {
        return c.json({ error: "User Not Found" }, 400);
      }

      if (!name) {
        return c.json({ error: "Name is required" }, 400);
      }

      if (!address) {
        return c.json({ error: "Address is required" }, 400);
      }

      if (!phone) {
        return c.json({ error: "Phone Number is required" }, 400);
      }

      const [data] = await db
        .insert(branchesTable)
        .values({
          name,
          userId: user.id,
          address,
          phone,
          gstNo,
        })
        .returning();

      await db.insert(invoiceTable).values({
        userId: user.id,
        branchId: data.id,
        lastInvoiceNumber: 0,
      });

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
        ids: z.array(z.string()),
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

      const data = await db
        .delete(branchesTable)
        .where(
          and(
            eq(branchesTable.userId, user.id),
            inArray(branchesTable.id, values.ids)
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
        id: z.string().uuid("Invalid branch Id").optional(),
        email: z.string().email(),
      })
    ),
    zValidator(
      "json",
      insertBranchSchema.pick({
        name: true,
        address: true,
        phone: true,
        gstNo: true,
      })
    ),
    async (c) => {
      const id = c.req.valid("param").id;
      const email = c.req.valid("param").email;
      const name = c.req.valid("json").name;
      const address = c.req.valid("json").address;
      const phone = c.req.valid("json").phone;
      const gstNo = c.req.valid("json").gstNo;

      if (!id) {
        return c.json({ error: "branch id is required" }, 400);
      }

      if (!email) {
        return c.json({ error: "Email Id is required" }, 400);
      }

      if (!name) {
        return c.json({ error: "Name is required" }, 400);
      }

      if (!address) {
        return c.json({ error: "Address is required" }, 400);
      }

      if (!phone) {
        return c.json({ error: "Phone Number is required" }, 400);
      }

      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));

      if (!user) {
        return c.json({ error: "User Not Found" }, 404);
      }

      const [data] = await db
        .update(branchesTable)
        .set({
          name,
          address,
          phone,
          gstNo,
        })
        .where(and(eq(branchesTable.userId, user.id), eq(branchesTable.id, id)))
        .returning();

      if (!data) {
        return c.json({ error: "branch Not Found" }, 404);
      }

      return c.json({ data }, 200);
    }
  )
  .delete(
    "/:id",
    zValidator(
      "param",
      z.object({
        id: z.string().uuid("Invalid branch Id").optional(),
        email: z.string().email(),
      })
    ),
    async (c) => {
      const id = c.req.valid("param").id;
      const email = c.req.valid("param").email;

      if (!id) {
        return c.json({ error: "branch id is required" }, 400);
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
        .delete(branchesTable)
        .where(and(eq(branchesTable.userId, user.id), eq(branchesTable.id, id)))
        .returning();

      if (!data) {
        return c.json({ error: "branch Not Found" }, 404);
      }

      return c.json({ data }, 200);
    }
  );

export default app;
