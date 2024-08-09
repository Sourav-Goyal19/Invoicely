import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  varchar,
  uuid,
  integer,
  decimal,
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

export const branchRelations = relations(branchesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [branchesTable.userId],
    references: [usersTable.id],
  }),
}));

export const insertBranchSchema = createInsertSchema(branchesTable);

export const categoriesTable = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  userId: uuid("user_id")
    .references(() => usersTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categoryRelations = relations(
  categoriesTable,
  ({ many, one }) => ({
    transactions: many(transactionsTable),
    user: one(usersTable, {
      fields: [categoriesTable.userId],
      references: [usersTable.id],
    }),
  })
);

export const insertCategorySchema = createInsertSchema(categoriesTable);

export const transactionsTable = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  price: integer("price").notNull(),
  product: text("product").notNull(),
  quantity: integer("quantity").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date", { mode: "date" }).notNull(),
  categoryId: uuid("category_id").references(() => categoriesTable.id),
  userId: uuid("user_id")
    .references(() => usersTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
});

export const transactionsRelations = relations(
  transactionsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [transactionsTable.userId],
      references: [usersTable.id],
    }),
    category: one(categoriesTable, {
      fields: [transactionsTable.categoryId],
      references: [categoriesTable.id],
    }),
  })
);
export const insertTransactionsSchema = createInsertSchema(transactionsTable, {
  date: z.coerce.date(),
  price: z.coerce.number().multipleOf(0.01),
  total: z.coerce.number().multipleOf(0.01),
});
