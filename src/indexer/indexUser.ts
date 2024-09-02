import { tonClient } from "~/indexer/lib/getUserData";
import { db } from "~/server/db";
import { statusLogger, normalLogger } from "./log";
import dayjs from "dayjs";
import { EvaaUser } from "./EvaaUser";
import { Address } from "@ton/core";
import { Evaa, getPrices } from "@evaafi/sdk";
const priceDicimal = 10n ** 7n;
const evaa = tonClient.open(
  new Evaa({
    testnet: process.env.IS_TESTNET === "true",
  }),
);
const priceData = await getPrices();
export const evaaConfig = {
  evaa,
  priceData,
};
export async function indexUser(
  userContractAddressQueue: { address: string; txHash: string }[],
  ltThanMinutes = 10,
  excludeLowTotalDebt = 0,
) {
  await evaa.getSync();

  while (true) {
    const currentUserContractAddress = userContractAddressQueue.pop();
    if (!currentUserContractAddress) {
      // queue is empty，maybe we can add utime > 1h users
      const lowHealthUsers = await db.userContract.findMany({
        where: {
          lastUtime: {
            lt: dayjs().subtract(ltThanMinutes, "minutes").toISOString(),
          },
          totalDebt: {
            gte: excludeLowTotalDebt,
          },
        },
        orderBy: {
          healthFactor: "asc",
        },
        take: 100,
      });
      // statusLogger.debug(
      //   "queue is empty, add users from user table",
      //   lowHealthUsers.length,
      // );
      if (lowHealthUsers.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
      userContractAddressQueue.push(
        ...lowHealthUsers.map((v) => ({
          address: v.contractAddress,
          txHash: "",
        })),
      );
      await evaa.getSync();
      evaaConfig.priceData = await getPrices();
      await new Promise((resolve) => setTimeout(resolve, 300));
      continue;
    }

    try {
      const oldUserIns = await db.userContract.findFirst({
        where: {
          contractAddress: currentUserContractAddress.address,
        },
      });
      // 只是为了初始化时候使用
      if (
        process.env.FILTER_USER_REQUEST === "true" &&
        oldUserIns &&
        dayjs().diff(dayjs(oldUserIns.lastUtime), "minute") < 5
      ) {
        normalLogger.debug(dayjs().diff(dayjs(oldUserIns.lastUtime), "minute"));
        continue;
      }
      const contract = tonClient.open(
        EvaaUser.createFromAddress(
          Address.parse(currentUserContractAddress.address),
          false,
        ),
      );
      const data = await contract.getSync(
        evaa.data!.assetsData,
        evaa.data!.assetsConfig,
        evaaConfig.priceData!.dict,
      );
      if (!data) {
        statusLogger.debug(
          "user not found",
          currentUserContractAddress.address,
        );
        continue;
      }
      normalLogger.debug("get user data", currentUserContractAddress.address);

      if (oldUserIns !== null) {
        await db.userContract.update({
          where: {
            contractAddress: currentUserContractAddress.address,
          },
          data: {
            codeVersion: Number(data.codeVersion.toString()),
            tonAmount: data.userBalances.TON.toString(),
            tsTonAmount: data.userBalances.tsTON.toString(),
            stTonAmount: data.userBalances.stTON.toString(),
            USDTAmount: data.userBalances.USDT.toString(),
            jUSDTAmount: data.userBalances.jUSDT.toString(),
            jUSDCAmount: data.userBalances.jUSDC.toString(),
            lastUtime: new Date(),
            userDataBOC: data.userDataBOC,
            healthFactor: data.healthFactor,
            totalDebt: (data.totalDebt / priceDicimal).toString(),
          },
        });
      } else {
        await db.userContract.create({
          data: {
            walletAddress: data.userAddress.toString(),
            contractAddress: currentUserContractAddress.address,
            codeVersion: Number(data.codeVersion.toString()),
            tonAmount: data.userBalances.TON.toString(),
            tsTonAmount: data.userBalances.tsTON.toString(),
            stTonAmount: data.userBalances.stTON.toString(),
            USDTAmount: data.userBalances.USDT.toString(),
            jUSDTAmount: data.userBalances.jUSDT.toString(),
            jUSDCAmount: data.userBalances.jUSDC.toString(),
            lastUtime: new Date(),
            userDataBOC: data.userDataBOC,
            healthFactor: data.healthFactor,
            totalDebt: (data.totalDebt / priceDicimal).toString(),
          },
        });
      }
    } catch (error) {
      statusLogger.error(
        "error in indexUser",
        currentUserContractAddress,
        error,
      );
    }
  }
}
