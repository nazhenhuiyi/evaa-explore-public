import { config } from "dotenv";
import axios from "axios";
import https from "https";
import { EVAA_MASTER_MAINNET } from "~/indexer/lib/constants";
import axiosRetry from "axios-retry";
import { writeFileSync } from "fs";
import dayjs from "dayjs";
import { db } from "~/server/db";
import { max, sortBy, last, uniqBy } from "lodash-es";
import type {
  JettonNotifyBody,
  JettonTransferBody,
  Transaction,
} from "./types";
import {
  getAssetsNameByAddress,
  getAssetsNameByAssetId,
} from "~/indexer/lib/getAssetsName";
import {
  parseLiquidateFailMsg,
  parseLiquidateJetton,
  parseLiquidateSatisfyInMsg,
  parseLiquidateTon,
  parseWithdrawal,
} from "./parse";
import { indexUser } from "./indexUser";
import { statusLogger, normalLogger } from "./log";

config();
console.log(process.env.IS_TESTNET === "true");
export const tonApiEndpoint =
  process.env.IS_TESTNET === "true"
    ? process.env.TEST_TONAPI_ENDPOINT
    : process.env.TONAPI_ENDPOINT;
axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
});

const tonApi = axios.create({
  baseURL: tonApiEndpoint,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
  headers: {
    Authorization: process.env.TONAPI_KEY,
  },
});
const LIMIT = 1000;
export function getRequest(address: string, after_lt = 0n) {
  if (after_lt === 0n)
    return `v2/blockchain/accounts/${address}/transactions?limit=${LIMIT}&sort_order=asc`;
  else
    return `v2/blockchain/accounts/${address}/transactions?after_lt=${after_lt}&?limit=${LIMIT}&sort_order=asc`;
}
const latest_transaction = await db.transactions.findFirst({
  orderBy: {
    lt: "desc",
  },
  take: 1,
});
const latest_liquidate_transaction = await db.liquidateTransaction.findFirst({
  orderBy: {
    lt: "desc",
  },
  take: 1,
});
let after_lt = max([
  latest_transaction?.lt ?? 0n,
  latest_liquidate_transaction?.lt ?? 0n,
]);
normalLogger.debug("start indexing transactions from", after_lt);
const userContractAddressQueue: { address: string; txHash: string }[] = [];
async function indexer() {
  while (true) {
    let res;
    try {
      res = await tonApi.get(
        getRequest(EVAA_MASTER_MAINNET.toString(), after_lt),
      );
    } catch (error) {
      writeFileSync(
        `./log/log_${dayjs().format("YYYY-MM-DD HH:mm:ss")}.json`,
        JSON.stringify(
          {
            after_lt: after_lt?.toString(),
            time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          },
          null,
          2,
        ),
      );
      // 记录最近的失败的 lt，下次从这里继续
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const transactions = (res?.data.transactions || []) as Transaction[];
    if (transactions.length > 0) {
      after_lt = BigInt(last(transactions)?.lt ?? 0n);
      normalLogger.debug("the latest lt", after_lt);
    } else {
      normalLogger.debug("no transactions");
    }
    // as backup file
    writeFileSync(
      `./log/after_lt_${after_lt}.json`,
      JSON.stringify(transactions, null, 2),
    );

    for (const transaction of transactions) {
      const outMsgs = sortBy(transaction.out_msgs, ["created_lt"]);
      const lastMsg = last(outMsgs);
      if (!lastMsg) {
        continue;
      }
      const lastMsgDestinationAddress = transaction.compute_phase.success
        ? lastMsg.destination.address
        : null;

      if (transaction.in_msg.op_code === "0x7362d09c" && lastMsg) {
        const notifyDecodedBody = transaction.in_msg
          .decoded_body as unknown as JettonNotifyBody;
        const assetsName = getAssetsNameByAddress(
          transaction.in_msg.source.address,
        );
        if (!assetsName) {
          statusLogger.error(
            "jetton not found in the jetton notify body",
            transaction.hash,
          );
          continue;
        }
        if (notifyDecodedBody.forward_payload.value.op_code === 1) {
          normalLogger.debug("supply jetton", transaction.hash);
          lastMsgDestinationAddress &&
            userContractAddressQueue.push({
              address: lastMsgDestinationAddress,
              txHash: transaction.hash,
            });
          await db.transactions.create({
            data: {
              txHash: transaction.hash,
              lt: transaction.lt,
              createAt: new Date(transaction.utime * 1000),
              amount: notifyDecodedBody.amount,
              userAddress: notifyDecodedBody.sender,
              userContractAddress: lastMsgDestinationAddress,
              assetsName: assetsName,
              status: transaction.compute_phase.success ? "SUCCESS" : "FAIL",
              type: "SUPPLY",
            },
          });
        }

        if (notifyDecodedBody.forward_payload.value.op_code == 3) {
          normalLogger.debug("liquidate jetton", transaction.hash);
          let liquidateBody = null;
          try {
            liquidateBody = parseLiquidateJetton(
              notifyDecodedBody.forward_payload.value.value,
            );
          } catch (error) {
            statusLogger.error("parseLiquidateJetton fail", transaction.hash);
          }
          if (liquidateBody) {
            // userContractAddressQueue.push({
            //   address: liquidateBody.borrowerAddress.toString(),
            //   txHash: transaction.hash,
            // });

            await db.liquidateTransaction.create({
              data: {
                txHash: transaction.hash,
                lt: transaction.lt,
                createdAt: new Date(transaction.utime * 1000),
                status: lastMsg.op_code === "0x0f8a7ea5" ? "FAIL" : "PENDING",
                borrowerAddress: liquidateBody.borrowerAddress.toString(),
                liquidatorAddress: notifyDecodedBody.sender,
                liquidationAssetName: assetsName,
                minCollateralAmount:
                  liquidateBody.minCollateralAmount.toString(),
                collateralAmount: "0", // pending
                collateralAssetName: getAssetsNameByAssetId(
                  liquidateBody.collateralAssetID,
                )!,
                queryId: notifyDecodedBody.query_id.toString(),
                liquidationAmount: notifyDecodedBody.amount,
              },
            });
          }
        }
      }
      // ton supply
      if (transaction.in_msg.op_code === "0x00000001" && lastMsg) {
        normalLogger.debug("ton supply", transaction.hash);
        lastMsgDestinationAddress &&
          userContractAddressQueue.push({
            address: lastMsgDestinationAddress,
            txHash: transaction.hash,
          });
        await db.transactions.create({
          data: {
            txHash: transaction.hash,
            lt: transaction.lt,
            createAt: new Date(transaction.utime * 1000),
            amount: transaction.in_msg.value.toString(),
            userAddress: transaction.in_msg.source.address,
            userContractAddress: lastMsgDestinationAddress,
            assetsName: "TON",
            status: transaction.compute_phase.success ? "SUCCESS" : "FAIL",
            type: "SUPPLY",
          },
        });
      }
      // withdraw
      if (transaction.in_msg.op_code === "0x00000002" && lastMsg) {
        normalLogger.debug("withdraw", transaction.hash);
        lastMsgDestinationAddress &&
          userContractAddressQueue.push({
            address: lastMsgDestinationAddress,
            txHash: transaction.hash,
          });
        let withdrawBody;
        try {
          withdrawBody = parseWithdrawal(transaction.in_msg.raw_body);
        } catch (error) {
          statusLogger.error("parse withdrawal body error", transaction.hash);
        }
        if (!withdrawBody) {
          continue;
        }
        await db.transactions.create({
          data: {
            txHash: transaction.hash,
            lt: transaction.lt,
            createAt: new Date(transaction.utime * 1000),
            amount: withdrawBody.amount.toString(),
            userAddress: transaction.in_msg.source.address,
            userContractAddress: lastMsgDestinationAddress,
            assetsName:
              getAssetsNameByAssetId(withdrawBody.assetId) ?? "unkown",
            status: transaction.compute_phase.success ? "PENDING" : "FAIL",
            type: "WITHDRAW",
          },
        });
      }
      if (transaction.in_msg.op_code === "0x00000211" && lastMsg) {
        normalLogger.debug(
          "withdraw assets and transfer it to user",
          transaction.hash,
        );
        if (lastMsg.op_code === "0x0f8a7ea5") {
          normalLogger.debug("transfer jetton assets", transaction.hash);
          const tx = await db.transactions.findFirst({
            where: {
              status: "PENDING",
              userAddress: (
                lastMsg.decoded_body as unknown as JettonTransferBody
              ).destination,
              assetsName: getAssetsNameByAddress(lastMsg.destination.address),
            },
          });
          if (!tx) {
            statusLogger.error(
              "no pending tx, can't find jetton transfer",
              transaction.hash,
            );
            continue;
          }
          await db.transactions.update({
            where: {
              txHash: tx.txHash,
            },
            data: {
              status: "SUCCESS",
              amount: (
                lastMsg.decoded_body as unknown as JettonTransferBody
              ).amount.toString(),
            },
          });
        } else {
          normalLogger.debug("transfer ton assets", transaction.hash);
          const tx = await db.transactions.findFirst({
            where: {
              status: "PENDING",
              userAddress: lastMsg.destination.address,
              assetsName: "TON",
            },
          });
          if (!tx) {
            statusLogger.error(
              "no pending tx, can't find ton transfer",
              transaction.hash,
            );
            continue;
          }
          await db.transactions.update({
            where: {
              txHash: tx.txHash,
            },
            data: {
              status: "SUCCESS",
              amount: tx.amount == "-1" ? lastMsg.value.toString() : tx.amount,
            },
          });
        }
      }
      if (transaction.in_msg.op_code === "0x00000003") {
        normalLogger.debug("liquidate ton", transaction.hash);
        const liquidateMsg = parseLiquidateTon(transaction.in_msg.raw_body);
        if (!liquidateMsg) {
          statusLogger.error("parseLiquidateTon error", transaction.hash);
          continue;
        }
        // userContractAddressQueue.push({
        //   address: liquidateMsg.borrowAddress.toString(),
        //   txHash: transaction.hash,
        // });
        await db.liquidateTransaction.create({
          data: {
            txHash: transaction.hash,
            lt: transaction.lt,
            createdAt: new Date(transaction.utime * 1000),
            status: transaction.compute_phase.success ? "PENDING" : "FAIL",
            borrowerAddress: liquidateMsg.borrowAddress.toString(),
            liquidatorAddress: transaction.in_msg.source.address,
            liquidationAssetName: "TON",
            minCollateralAmount: liquidateMsg.minCollateralAmount.toString(),
            collateralAmount: "0",
            collateralAssetName:
              getAssetsNameByAssetId(liquidateMsg.collateralAsset) ?? "unkown",
            queryId: liquidateMsg.querryId.toString(),
            liquidationAmount: (
              liquidateMsg.liquidationAmount ?? BigInt(transaction.in_msg.value)
            ).toString(),
          },
        });
      }
      if (transaction.in_msg.op_code === "0x00000311" && lastMsg) {
        normalLogger.debug("liquidate satisfy", transaction.hash);
        let satisfyInMsg;
        try {
          satisfyInMsg = parseLiquidateSatisfyInMsg(
            transaction.in_msg.raw_body,
          );
        } catch (error) {
          statusLogger.error(
            "parseLiquidateSatisfyInMsg error",
            transaction.hash,
          );
        }

        if (!satisfyInMsg) {
          continue;
        }

        const liquidate_tx = await db.liquidateTransaction.findFirst({
          where: {
            queryId: satisfyInMsg.queryId.toString(),
            status: "PENDING",
          },
        });
        if (liquidate_tx === null) {
          statusLogger.error(
            "no pending liquidate tx, so can't change liquidate status",
            satisfyInMsg.queryId,
            transaction.hash,
          );
          continue;
        }
        await db.liquidateTransaction.update({
          where: {
            txHash: liquidate_tx.txHash,
          },
          data: {
            status: "SUCCESS",
            collateralAmount:
              lastMsg.op_code === "0x0f8a7ea5"
                ? BigInt(
                    (lastMsg.decoded_body as unknown as JettonNotifyBody)
                      .amount,
                  ).toString()
                : lastMsg.value + "",
          },
        });
      }
      if (transaction.in_msg.op_code === "0x0000031f") {
        normalLogger.debug("liquidate fail", transaction.hash);
        let liquidateFailMsg;
        try {
          liquidateFailMsg = parseLiquidateFailMsg(transaction.in_msg.raw_body);
        } catch (error) {
          statusLogger.error("parseLiquidateFailMsg error", transaction.hash);
        }
        if (!liquidateFailMsg) {
          continue;
        }
        const tx = await db.liquidateTransaction.findFirst({
          where: {
            queryId: liquidateFailMsg.queryID.toString(),
            liquidatorAddress: liquidateFailMsg.liquidatorAddress.toRawString(),
          },
        });
        if (!tx) {
          statusLogger.error(
            "no pending liquidate tx, so can't change liquidate status",
            liquidateFailMsg.queryID,
            transaction.hash,
          );
          continue;
        }
        await db.liquidateTransaction.update({
          where: {
            txHash: tx.txHash,
          },
          data: {
            status: "FAIL",
            collateralAssetName: getAssetsNameByAssetId(
              liquidateFailMsg.collateralAssetID,
            ),
            errorCode: liquidateFailMsg.errorCode,
          },
        });
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
void indexer();

void indexUser(userContractAddressQueue, 10, 1000);
// 如果用户数据太多，每隔12小时刷新一次
void indexUser([], 60 * 24);
