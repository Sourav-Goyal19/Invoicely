import { db } from "@/db/drizzle";
import {
  branchesTable,
  purchaseTransactionsTable,
  usersTable,
} from "@/db/schema";
import { calculatePercentageChange, fillMissingDays } from "@/lib/utils";
import { zValidator } from "@hono/zod-validator";
import { differenceInDays, parse, subDays } from "date-fns";
import { and, desc, eq, gte, lt, lte, sql, sum } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

const app = new Hono().get(
  "/",
  zValidator(
    "query",
    z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      branchId: z.string().optional(),
    })
  ),
  zValidator(
    "param",
    z.object({
      email: z.string().email(),
    })
  ),
  async (c) => {
    const { from, to, branchId } = c.req.valid("query");
    const { email } = c.req.valid("param");

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const defaultTo = new Date();
    const defaultFrom = subDays(defaultTo, 30);

    const startDate = from
      ? parse(from, "yyyy-MM-dd", new Date())
      : defaultFrom;
    const endDate = to ? parse(to, "yyyy-MM-dd", new Date()) : defaultTo;

    const periodLength = differenceInDays(endDate, startDate) + 1;
    const lastPeriodStart = subDays(startDate, periodLength);
    const lastPeriodEnd = subDays(endDate, periodLength);

    async function fetchFinancialData(
      userId: string,
      startDate: Date,
      endDate: Date
    ) {
      return await db
        .select({
          income:
            sql`SUM(CASE WHEN ${purchaseTransactionsTable.price} >= 0 THEN ${purchaseTransactionsTable.price} ELSE 0 END)`.mapWith(
              Number
            ),
          expenses:
            sql`SUM(CASE WHEN ${purchaseTransactionsTable.price} < 0 THEN ${purchaseTransactionsTable.price} ELSE 0 END)`.mapWith(
              Number
            ),
          remaining: sum(purchaseTransactionsTable.price).mapWith(Number),
        })
        .from(purchaseTransactionsTable)
        .where(
          and(
            eq(purchaseTransactionsTable.userId, userId),
            gte(purchaseTransactionsTable.date, startDate),
            lte(purchaseTransactionsTable.date, endDate)
          )
        );
    }

    const [currentPeriod] = await fetchFinancialData(
      user.id,
      startDate,
      endDate
    );

    const [lastPeriod] = await fetchFinancialData(
      user.id,
      lastPeriodStart,
      lastPeriodEnd
    );

    const formattedCurrentPeriod = {
      income: currentPeriod.income,
      expenses: currentPeriod.expenses,
      remaining: currentPeriod.remaining,
    };

    const formattedLastPeriod = {
      income: lastPeriod.income,
      expenses: lastPeriod.expenses,
      remaining: lastPeriod.remaining,
    };

    const incomeChange = calculatePercentageChange(
      formattedCurrentPeriod.income,
      formattedLastPeriod.income
    );

    const expensesChange = calculatePercentageChange(
      formattedCurrentPeriod.expenses,
      formattedLastPeriod.expenses
    );

    const remainingChange = calculatePercentageChange(
      formattedCurrentPeriod.remaining,
      formattedLastPeriod.remaining
    );

    const activeDays = await db
      .select({
        date: purchaseTransactionsTable.date,
        income:
          sql`SUM(CASE WHEN ${purchaseTransactionsTable.price} >= 0 THEN ${purchaseTransactionsTable.price} ELSE 0 END)`.mapWith(
            Number
          ),
        expenses:
          sql`SUM(CASE WHEN ${purchaseTransactionsTable.price} < 0 THEN ABS(${purchaseTransactionsTable.price}) ELSE 0 END)`.mapWith(
            Number
          ),
      })
      .from(purchaseTransactionsTable)
      .where(
        and(
          eq(purchaseTransactionsTable.userId, user.id),
          gte(purchaseTransactionsTable.date, startDate),
          lte(purchaseTransactionsTable.date, endDate)
        )
      )
      .groupBy(purchaseTransactionsTable.date)
      .orderBy(purchaseTransactionsTable.date);

    const formattedActiveDays = activeDays.map((item) => ({
      date: item.date,
      income: item.income,
      expenses: item.expenses,
    }));

    const days = fillMissingDays(formattedActiveDays, startDate, endDate);

    return c.json(
      {
        data: {
          remainingprice: formattedCurrentPeriod.remaining,
          remainingChange: remainingChange,
          incomeprice: formattedCurrentPeriod.income,
          incomeChange: incomeChange,
          expensesprice: formattedCurrentPeriod.expenses,
          expensesChange: expensesChange,
          days: days,
        },
      },
      200
    );
  }
);

export default app;
