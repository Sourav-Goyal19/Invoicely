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
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  image: text("image"),
  password: varchar("password", { length: 255 }),
  otp: varchar("otp", { length: 6 }),
  otpExpiry: timestamp("otpExpiry"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userRelations = relations(usersTable, ({ many }) => ({
  purchaseTransactions: many(purchaseTransactionsTable),
  salesTransactions: many(salesTransactionsTable),
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
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  gstNo: text("gst_no"),
  signatureImageUrl: text("signature_image_url"),
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
    purchaseTransactions: many(purchaseTransactionsTable),
    salesTransactions: many(salesTransactionsTable),
    user: one(usersTable, {
      fields: [categoriesTable.userId],
      references: [usersTable.id],
    }),
  })
);

export const insertCategorySchema = createInsertSchema(categoriesTable);

export const purchaseTransactionsTable = pgTable("purchase_transactions", {
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

export const purchaseTransactionsRelations = relations(
  purchaseTransactionsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [purchaseTransactionsTable.userId],
      references: [usersTable.id],
    }),
    category: one(categoriesTable, {
      fields: [purchaseTransactionsTable.categoryId],
      references: [categoriesTable.id],
    }),
  })
);
export const insertPurchaseTransactionsSchema = createInsertSchema(
  purchaseTransactionsTable,
  {
    date: z.coerce.date(),
    price: z.coerce.number().multipleOf(0.01),
    total: z.coerce.number().multipleOf(0.01),
  }
);

export const salesTransactionsTable = pgTable("sales_transactions", {
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

export const salesTransactionsRelations = relations(
  salesTransactionsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [salesTransactionsTable.userId],
      references: [usersTable.id],
    }),
    category: one(categoriesTable, {
      fields: [salesTransactionsTable.categoryId],
      references: [categoriesTable.id],
    }),
  })
);

export const insertSalesTransactionsSchema = createInsertSchema(
  salesTransactionsTable,
  {
    date: z.coerce.date(),
    price: z.coerce.number().multipleOf(0.01),
    total: z.coerce.number().multipleOf(0.01),
  }
);

export const invoiceItemTable = pgTable("invoice_item", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceNumber: integer("invoice_number").default(0).notNull(),
  date: timestamp("date", { mode: "date" }).notNull(),
  userId: uuid("user_id")
    .references(() => usersTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  invoiceId: uuid("invoice_id")
    .references(() => invoiceTable.id)
    .notNull(),
  total: text("total").default("0").notNull(),
  branchId: uuid("branch_id")
    .references(() => branchesTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
});

export const invoiceItemRelations = relations(invoiceItemTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [invoiceItemTable.userId],
    references: [usersTable.id],
  }),
  branch: one(branchesTable, {
    fields: [invoiceItemTable.branchId],
    references: [branchesTable.id],
  }),
  invoice: one(invoiceTable, {
    fields: [invoiceItemTable.invoiceId],
    references: [invoiceTable.id],
  }),
}));

export const insertInvoiceItemSchema = createInsertSchema(invoiceItemTable);

export const invoiceTable = pgTable("invoice", {
  id: uuid("id").defaultRandom().primaryKey(),
  lastInvoiceNumber: integer("last_invoice_number").default(0).notNull(),
  userId: uuid("user_id")
    .references(() => usersTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  branchId: uuid("branch_id")
    .references(() => branchesTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  invoiceItemIds: uuid("invoice_item_ids").array(),
});

export const invoiceRelations = relations(invoiceTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [invoiceTable.userId],
    references: [usersTable.id],
  }),
  branch: one(branchesTable, {
    fields: [invoiceTable.branchId],
    references: [branchesTable.id],
  }),
  invoiceItems: many(invoiceItemTable),
}));
