import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  varchar,
  uuid,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  image: text("image"),
  password: varchar("password", { length: 255 }),
  otp: varchar("otp", { length: 6 }),
  otpExpiry: timestamp("otpExpiry"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userRelations = relations(usersTable, ({ many }) => ({
  transactions: many(transactionsTable),
  branches: many(branchesTable),
}));

export const branchesTable = pgTable("branches", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => usersTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const branchRelations = relations(branchesTable, ({ many, one }) => ({
  transactions: many(transactionsTable),
  user: one(usersTable, {
    fields: [branchesTable.userId],
    references: [usersTable.id],
  }),
}));

export const insertBranchSchema = createInsertSchema(branchesTable);

export const transactionsTable = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  amount: integer("amount").notNull(),
  product: text("product").notNull(),
  quantity: integer("quantity").notNull().default(1),
  cgstPercent: integer("cgst_percent").notNull().default(0),
  sgstPercent: integer("sgst_percent").notNull().default(0),
  cgstAmount: integer("cgst_amount").notNull().default(0),
  sgstAmount: integer("sgst_amount").notNull().default(0),
  total: integer("total").notNull().default(0),
  date: timestamp("date", { mode: "date" }).notNull(),
  branchId: uuid("branch_id")
    .references(() => branchesTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  userId: uuid("user_id")
    .references(() => usersTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
});

export const transactionsRelations = relations(
  transactionsTable,
  ({ one }) => ({
    branch: one(branchesTable, {
      fields: [transactionsTable.branchId],
      references: [branchesTable.id],
    }),
    user: one(usersTable, {
      fields: [transactionsTable.userId],
      references: [usersTable.id],
    }),
  })
);

export const insertTransactionsSchema = createInsertSchema(transactionsTable, {
  date: z.coerce.date(),
});
