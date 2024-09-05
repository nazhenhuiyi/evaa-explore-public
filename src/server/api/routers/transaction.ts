import dayjs from "dayjs";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
type TransactionData = {
  date: string;
  count: bigint;
};

const fillMissingDates = (
  dates: string[],
  data: TransactionData[],
): TransactionData[] => {
  const dataMap = new Map<string, bigint>();
  data.forEach((item) =>
    dataMap.set(dayjs(item.date).format("YYYY-MM-DD"), item.count),
  );

  return dates.map((date) => ({
    date,
    count: dataMap.get(date) ?? 0n,
  }));
};

const getAllDatesInRange = (startDate: Date, endDate: Date): string[] => {
  const dates: string[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(dayjs(currentDate).format("YYYY-MM-DD")); // cast to string to fix the type error in the next linecurrentDate);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};
export const transactionRouter = createTRPCRouter({
  getTransaction: publicProcedure
    .input(
      z.object({
        userAddress: z.string().optional(),
        current: z.number(),
        sort: z.enum(["asc", "desc"]).default("desc"),
        orderBy: z
          .object({
            amount: z.enum(["asc", "desc"]).optional(),
            createAt: z.enum(["asc", "desc"]).optional(),
          })
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const count = await ctx.db.transactions.count({
        where: {
          userAddress: input.userAddress,
        },
      });
      const txs = await ctx.db.transactions.findMany({
        where: {
          userAddress: input.userAddress,
        },
        take: 20,
        skip: (input.current - 1) * 20,
        orderBy: input.orderBy,
      });
      return {
        count,
        txs,
      };
    }),
  getLiquidationTransaction: publicProcedure
    .input(
      z.object({
        borrowerAddress: z.string().optional(),
        liquidatorAddress: z.string().optional(),
        current: z.number(),
        sort: z.enum(["asc", "desc"]).default("desc"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const count = await ctx.db.liquidateTransaction.count({
        where: {
          borrowerAddress: input.borrowerAddress,
          liquidatorAddress: input.liquidatorAddress,
        },
      });
      const txs = await ctx.db.liquidateTransaction.findMany({
        where: {
          borrowerAddress: input.borrowerAddress,
          liquidatorAddress: input.liquidatorAddress,
        },
        take: 20,
        orderBy: { lt: input.sort },
        skip: (input.current - 1) * 20,
      });
      return {
        count,
        txs,
      };
    }),

  getAnalytics: publicProcedure
    .input(z.object({}))
    .query(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const withdrawTxs = await ctx.db.$queryRaw`
      SELECT
        DATE("createAt") AS date,
        COUNT(*) AS count
      FROM
        "Transactions"
      WHERE
        "createAt" >= now() - INTERVAL '3 month'
        AND type = 'WITHDRAW'
      GROUP BY
        DATE("createAt")
      ORDER BY
        date ASC`;
      const supplyTxs = await ctx.db.$queryRaw`
      SELECT
        DATE("createAt") AS date,
        COUNT(*) AS count
      FROM
        "Transactions"
      WHERE
        "createAt" >= now() - INTERVAL '3 month'
        AND type = 'SUPPLY'
      GROUP BY
        DATE("createAt")
      ORDER BY
        date ASC`;
      return {
        withdrawTxs: withdrawTxs as { date: string; count: bigint }[],
        supplyTxs: supplyTxs as { date: string; count: bigint }[],
      };
    }),
  getLiquidationAnalytics: publicProcedure
    .input(z.object({}))
    .query(async ({ ctx, input }) => {
      const startDate = dayjs().startOf("day").subtract(3, "month").toDate();
      const endDate = dayjs().startOf("day").toDate();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const successTxs = await ctx.db.$queryRaw`
      SELECT
        DATE("createdAt") AS date,
        COUNT(*) AS count
      FROM
        "LiquidateTransaction"
      WHERE
        "createdAt" >= now() - INTERVAL '3 month'
        AND status = 'SUCCESS'
      GROUP BY
        DATE("createdAt")
      ORDER BY
        date ASC`;
      const failTxs = await ctx.db.$queryRaw`
      SELECT
        DATE("createdAt") AS date,
        COUNT(*) AS count
      FROM
        "LiquidateTransaction"
      WHERE
        "createdAt" >= now() - INTERVAL '3 month'
        AND status = 'FAIL'
      GROUP BY
        DATE("createdAt")
      ORDER BY
        date ASC`;
      const allDates = getAllDatesInRange(startDate, endDate);
      return {
        withdrawTxs: fillMissingDates(
          allDates,
          successTxs as TransactionData[],
        ),
        supplyTxs: fillMissingDates(allDates, failTxs as TransactionData[]),
      };
    }),
});
