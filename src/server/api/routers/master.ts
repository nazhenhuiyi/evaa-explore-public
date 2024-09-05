import { Evaa } from "@evaafi/sdk";
import { z } from "zod";
import { tonClient } from "~/indexer/lib/getUserData";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
const evaa = tonClient.open(new Evaa({ testnet: false }));
export const masterRouter = createTRPCRouter({
  apy: publicProcedure.input(z.object({})).query(async ({ ctx, input }) => {
    const data = await evaa.getSync();
    console.log(evaa.data);
    console.log(data);
    return {
      data: evaa.data,
    };
  }),
});
