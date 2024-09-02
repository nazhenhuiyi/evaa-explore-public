import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  users: publicProcedure
    .input(
      z.object({
        current: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const count = await ctx.db.userContract.count();
      const txs = await ctx.db.userContract.findMany({
        take: 20,
        skip: (input.current - 1) * 20,
        orderBy: { healthFactor: "asc" },
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
