import { db } from "@/db/drizzle";
import { branchesTable, transactionsTable, usersTable } from "@/db/schema";
import {
  calculatePercentageChange,
  convertAmountFromMiliunits,
  fillMissingDays,
} from "@/lib/utils";
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
            sql`SUM(CASE WHEN ${transactionsTable.amount} >= 0 THEN ${transactionsTable.amount} ELSE 0 END)`.mapWith(
              Number
            ),
          expenses:
            sql`SUM(CASE WHEN ${transactionsTable.amount} < 0 THEN ${transactionsTable.amount} ELSE 0 END)`.mapWith(
              Number
            ),
          remaining: sum(transactionsTable.amount).mapWith(Number),
        })
        .from(transactionsTable)
        .innerJoin(
          branchesTable,
          eq(branchesTable.id, transactionsTable.branchId)
        )
        .where(
          and(
            branchId ? eq(transactionsTable.branchId, branchId) : undefined,
            eq(transactionsTable.userId, userId),
            gte(transactionsTable.date, startDate),
            lte(transactionsTable.date, endDate)
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
      income: convertAmountFromMiliunits(currentPeriod.income),
      expenses: convertAmountFromMiliunits(currentPeriod.expenses),
      remaining: convertAmountFromMiliunits(currentPeriod.remaining),
    };

    const formattedLastPeriod = {
      income: convertAmountFromMiliunits(lastPeriod.income),
      expenses: convertAmountFromMiliunits(lastPeriod.expenses),
      remaining: convertAmountFromMiliunits(lastPeriod.remaining),
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
        date: transactionsTable.date,
        income:
          sql`SUM(CASE WHEN ${transactionsTable.amount} >= 0 THEN ${transactionsTable.amount} ELSE 0 END)`.mapWith(
            Number
          ),
        expenses:
          sql`SUM(CASE WHEN ${transactionsTable.amount} < 0 THEN ABS(${transactionsTable.amount}) ELSE 0 END)`.mapWith(
            Number
          ),
      })
      .from(transactionsTable)
      .innerJoin(
        branchesTable,
        eq(branchesTable.id, transactionsTable.branchId)
      )
      .where(
        and(
          branchId ? eq(transactionsTable.branchId, branchId) : undefined,
          eq(transactionsTable.userId, user.id),
          gte(transactionsTable.date, startDate),
          lte(transactionsTable.date, endDate)
        )
      )
      .groupBy(transactionsTable.date)
      .orderBy(transactionsTable.date);

    const formattedActiveDays = activeDays.map((item) => ({
      date: item.date,
      income: convertAmountFromMiliunits(item.income),
      expenses: convertAmountFromMiliunits(item.expenses),
    }));

    const days = fillMissingDays(formattedActiveDays, startDate, endDate);

    return c.json(
      {
        data: {
          remainingAmount: formattedCurrentPeriod.remaining,
          remainingChange: remainingChange,
          incomeAmount: formattedCurrentPeriod.income,
          incomeChange: incomeChange,
          expensesAmount: formattedCurrentPeriod.expenses,
          expensesChange: expensesChange,
          days: days,
        },
      },
      200
    );
  }
);

export default app;
