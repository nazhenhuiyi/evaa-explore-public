import { Address, Dictionary } from "@ton/core";
import { MAINNET_ASSETS_ID } from "~/indexer/lib/constants";
import { TonClient, Contract } from "@ton/ton";
import { config } from "dotenv";
config();
console.log(process.env.RPC_ENDPOINT);
const rpcEndpoint =
  process.env.IS_TESTNET === "true"
    ? process.env.TEST_RPC_ENDPOINT
    : process.env.RPC_ENDPOINT;
export const tonClient = new TonClient({
  endpoint: rpcEndpoint!,
  apiKey:
    process.env.IS_TESTNET === "true"
      ? process.env.TEST_RPC_API_KEY
      : process.env.TONCENTER_API_KEY,
});

export const getData = async (address: string) => {
  const res = await tonClient.runMethodWithError(
    Address.parse(address),
    "getAllUserScData",
  );
  const codeVersion = res.stack.readNumber();
  const masterAddress = res.stack.readCell().beginParse().loadAddress();
  const userAddress = res.stack.readCell().beginParse().loadAddress();
  const principalsDict = res.stack
    .readCellOpt()
    ?.beginParse()
    .loadDictDirect(Dictionary.Keys.BigUint(256), Dictionary.Values.BigInt(64));
  const trackingSupplyIndex = res.stack.readBigNumber();
  const trackingBorrowIndex = res.stack.readBigNumber();
  const userBalances: Record<keyof typeof MAINNET_ASSETS_ID, bigint> = {
    TON: 0n,
    jUSDT: 0n,
    jUSDC: 0n,
    stTON: 0n,
    tsTON: 0n,
    USDT: 0n,
  };
  if (principalsDict) {
    for (const [key, assetID] of Object.entries(MAINNET_ASSETS_ID)) {
      userBalances[key as unknown as keyof typeof MAINNET_ASSETS_ID] =
        principalsDict.get(assetID) ?? 0n;
    }
  }

  return {
    userBalances,
    codeVersion,
    masterAddress,
    userAddress,
    principalsDict,
    trackingSupplyIndex,
    trackingBorrowIndex,
  };
};
