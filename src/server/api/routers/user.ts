import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  users: publicProcedure
    .input(
      z.object({
        current: z.number(),
        orderBy: z.object({
          healthFactor: z.enum(["asc", "desc"]).optional(),
          totalDebt: z.enum(["asc", "desc"]).optional(),
          tonAmount: z.enum(["asc", "desc"]).optional(),
          tsTonAmount: z.enum(["asc", "desc"]).optional(),
          stTonAmount: z.enum(["asc", "desc"]).optional(),
          USDTAmount: z.enum(["asc", "desc"]).optional(),
          jUSDTAmount: z.enum(["asc", "desc"]).optional(),
          jUSDCAmount: z.enum(["asc", "desc"]).optional(),
          lastUtime: z.enum(["asc", "desc"]).optional(),
        }),
      }),
    )
    .query(async ({ ctx, input }) => {
      const count = await ctx.db.userContract.count();
      const txs = await ctx.db.userContract.findMany({
        take: 20,
        skip: (input.current - 1) * 20,
        orderBy: input.orderBy,
      });
      return {
        count,
        txs,
      };
    }),

  user: publicProcedure
    .input(
      z.object({
        walletAddress: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.userContract.findFirst({
        where: {
          walletAddress: input.walletAddress,
        },
      });
      return user;
    }),
});
