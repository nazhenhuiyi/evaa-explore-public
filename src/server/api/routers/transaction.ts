import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const transactionRouter = createTRPCRouter({
  getTransaction: publicProcedure
    .input(
      z.object({
        userAddress: z.string().optional(),
        current: z.number(),
        sort: z.enum(["asc", "desc"]).default("desc"),
        orderBy: z
          .object({
            amount: z.enum(["asc", "desc"]),
            createAt: z.enum(["asc", "desc"]),
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
});
