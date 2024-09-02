/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * parse the data from the indexer response
 */
import {
  Address,
  beginCell,
  Cell,
  Dictionary,
  DictionaryValue,
  Slice,
} from "@ton/core";
import { TonClient, Transaction, TupleReader } from "@ton/ton";
import { config } from "dotenv";
import { MAINNET_ASSETS_ID } from "~/indexer/lib/constants";

config();
export async function parseUserFullData(contractAddress: string) {
  const tonClient = new TonClient({
    endpoint: process.env.RPC_ENDPOINT!,
    apiKey: process.env.RPC_API_KEY,
  });
  const userDataResult = await tonClient.runMethodWithError(
    Address.parse(contractAddress),
    "getAllUserScData",
  );
  const codeVersion = userDataResult.stack.readNumber();
  userDataResult.stack.readCell(); // master
  const userAddress = userDataResult.stack
    .readCell()
    .beginParse()
    .loadAddress();
  const principalsDict = userDataResult.stack
    .readCellOpt()
    ?.beginParse()
    .loadDictDirect(Dictionary.Keys.BigUint(256), Dictionary.Values.BigInt(64));
  return {
    userAddress,
    codeVersion,
    tonAmount: principalsDict?.get(MAINNET_ASSETS_ID.TON) ?? 0n,
    usdtAmount: principalsDict?.get(MAINNET_ASSETS_ID.USDT) ?? 0n,
    tsTonAmount: principalsDict?.get(MAINNET_ASSETS_ID.tsTON) ?? 0n,
    stTonAmount: principalsDict?.get(MAINNET_ASSETS_ID.stTON) ?? 0n,
    jUsdtAmount: principalsDict?.get(MAINNET_ASSETS_ID.jUSDT) ?? 0n,
    jUsdcAmount: principalsDict?.get(MAINNET_ASSETS_ID.jUSDC) ?? 0n,
  };
}

export const parseWithdrawal = (hexString: string) => {
  const BOC = Buffer.from(hexString, "hex");
  const cell = Cell.fromBoc(BOC)[0];
  if (!cell) return;
  const slice = cell.beginParse();
  const opCode = slice.loadBits(32);
  const querryId = slice.loadBits(64);
  const assetId = slice.loadUintBig(256);
  const amount = slice.loadIntBig(64);
  let userAddress = null;
  try {
    userAddress = slice.loadAddress();
  } catch (error) {}
  const includeUserCode = slice.loadInt(2);
  const price = slice.loadRef();
  slice.endParse();
  const result = {
    querryId,
    assetId,
    userAddress,
    amount,
    includeUserCode,
    opCode,
  };
  return result;
};

// jetton notify 0x7362d09c
// no need to do, tonapi is enough
export const parseJettonSupply = (hexString: string) => {
  const BOC = Buffer.from(hexString, "hex");
  const cell = Cell.fromBoc(BOC)[0];
  if (!cell) return;
  // const slice = cell.beginParse();
  // const opCode = slice.loadBits(32);
  // const querryId = slice.loadBits(64);
  // const amount = slice.loadCoins();
  // const masterAddress = slice.loadAddress();
  // const responseAddress = slice.loadAddress();
  // slice.loadBit();
  // const forwardAmount = slice.loadCoins();
  // slice.loadBit();
};

export const parseTonSupply = (hexString: string) => {
  const BOC = Buffer.from(hexString, "hex");
  const cell = Cell.fromBoc(BOC)[0];
  if (!cell) return;
  const slice = cell.beginParse();
  const opCode = slice.loadUint(32);
  const querryId = slice.loadUint(64);
  const includeUserCode = slice.loadInt(2);
  const amount = slice.loadUint(64);
  const userAddress = slice.loadAddress();
  slice.endParse();
  const result = {
    querryId,
    userAddress,
    amount,
    includeUserCode,
    opCode,
  };
  return result;
};

export const parseLiquidateTon = (hexString: string) => {
  const cell = Cell.fromBoc(Buffer.from(hexString, "hex"))[0];
  if (!cell) return;
  const slice = cell?.beginParse();
  const opCode = slice.loadBits(32);
  const querryId = slice.loadUintBig(64);
  const borrowAddress = slice.loadAddress();
  let liquidateAddress = null;
  try {
    liquidateAddress = slice.loadAddress();
  } catch (error) {}
  const collateralAsset = slice.loadUintBig(256);
  const minCollateralAmount = slice.loadUintBig(64);
  const includeUserCode = slice.loadInt(2);
  let liquidationAmount;
  try {
    liquidationAmount = slice.loadUintBig(64);
  } catch (error) {}
  slice.loadRef();
  // slice.endParse();

  return {
    opCode,
    querryId,
    borrowAddress,
    liquidateAddress,
    collateralAsset,
    minCollateralAmount,
    includeUserCode,
    liquidationAmount,
  };
};
// b5ee9c7201020f010002070001ee00000003801f0b395a78fb881391a8162d415176c62b53bdf0f35086b988dfd5f608c820f83003a36ecff8201a9bf1b6c6641de02c671588d8d8528f9a628473cc130a1e1cdf720f645b1a144200841347dd6a9b38c3ac791debb7834e03bb8862383959607f18000000000a89a83f0000000000000000010180e1719052de6d9359f203e6b035e22c2016927c48345396f5d7274d804aa4d15b210eda58539c1307a73ad794eeb9efa106b338504b7695a80a21c811b203480102020120030402012005060201200b0c02012007080052bf895668e908644f30322b997de8faaafc21f05aa52f8982f042dac1fe0b4d09d00000000196af9e410051bf748433fcbcc1ac75e54798fb9cdfd8d368b8d6ae3092f4c291cf8465590f7b14000000030c5ea38302037e9a090a0050bd93e2f57ba870af34480350c789b0987d15b43a53172bfce294de21e7d724e7000000019415a26a0050bda074805fc853987abe6f7fe3ad97a6a6f3077a16391fec744f671a015fbd7e0000000066b9f0a20201200d0e0052bf8a9006bd3fb03d355daeeff93b24be90afaa6e3ca0073ff5720f8a852c933278000000003b9fe9690051bf47b22d8d0a21004209a3eeb54d9c61d63c8ef5dbc1a701ddc4311c1cacb03f8c0000000077355ab90051bf670f2d046c32f2b194958abd36b7c71cd118ec635f0990ceac863e9350f1de6600000000773fd2d3
export const parseLiquidateJetton = (hexString: string) => {
  const cell = Cell.fromBoc(Buffer.from(hexString, "hex"))[0];
  if (!cell) return;
  const slice = cell?.beginParse();
  const opCode = slice.loadBits(32);
  const borrowerAddress = slice.loadAddress();
  let liquidatorAddress;
  try {
    liquidatorAddress = slice.loadAddress();
  } catch (e) {
    console.log(e);
  }
  const collateralAssetID = slice.loadUintBig(256);
  const minCollateralAmount = slice.loadInt(64);
  const includeUserCode = slice.loadInt(2);
  try {
    slice.loadBits(64);
  } catch (error) {}
  slice.loadRef();
  slice.endParse();
  return {
    opCode,
    borrowerAddress,
    liquidatorAddress,
    collateralAssetID,
    minCollateralAmount,
    includeUserCode,
  };
};
export const parseLiquidateSatisfyOutMsg = (hexString: string) => {
  const cell = Cell.fromBoc(Buffer.from(hexString, "hex"))[0];
  if (!cell) return;
  const slice = cell?.beginParse();
  slice.loadCoins();
  slice.loadMaybeRef();
  slice.loadInt(2);
  const reportOp = slice.loadUint(32);
  const querryId = slice.loadUintBig(64);
  console.log(reportOp, querryId);

  return {
    reportOp,
    querryId,
  };
};
export const parseLiquidateSatisfyInMsg = (hexString: string) => {
  const cell = Cell.fromBoc(Buffer.from(hexString, "hex"))[0];
  if (!cell) return;
  const slice = cell.beginParse();
  const opCode = slice.loadBits(32);
  const queryId = slice.loadUint(64);

  const extra = slice.loadRef().beginParse();
  extra.loadInt(64);
  const loanAmount = extra.loadUintBig(64);
  const gift = extra.loadUint(64); // protocol gift
  const newLoan = extra.loadUintBig(64); // user new loan principal
  const collateralAsset = extra.loadUintBig(256); // collateral asset id
  const deltaCollateral = extra.loadUintBig(64); // delta collateral principal
  const collateralAmount = extra.loadUintBig(64);

  return {
    loanAmount,
    gift,
    newLoan,
    collateralAsset,
    deltaCollateral,
    collateralAmount,
    opCode,
    queryId,
  };
};

// parse liquidate 311
//https://tonviewer.com/transaction/c73f3d0b793bf31d1313f563a77e826b818437fceb7ca9d6a4f5279c008ed570
// parse liquidate 31f
//https://tonviewer.com/transaction/dea5f8d565f959898a8dac555f2c162f8cd4710a6eb5179ec850bd67bc8b8815

const errorCodes = {
  0x30f1: "Master liquidating too much",
  0x31f2: "Not liquidatable",
  0x31f3: "Min collateral not satisfied",
  0x31f4: "User not enough collateral",
  0x31f5: "User liquidating too much",
  0x31f6: "Master not enough liquidity",
  0x31f0: "User withdraw in process",
};
export const parseLiquidateFailMsg = (hexString: string) => {
  const cell = Cell.fromBoc(Buffer.from(hexString, "hex"))[0];
  if (!cell) return;
  const slice = cell.beginParse();
  const op = slice.loadUint(32);
  const queryID = slice.loadUint(64);
  const userAddress = slice.loadAddress();
  const liquidatorAddress = slice.loadAddress();
  const assetID = slice.loadUintBig(256);
  const nextBody = slice.loadRef().beginParse();
  slice.endParse();
  const transferredAmount = nextBody.loadUintBig(64);
  const collateralAssetID = nextBody.loadUintBig(256);
  const minCollateralAmount = nextBody.loadUintBig(64);
  const errorCode = nextBody.loadUint(32);
  return {
    op,
    queryID,
    userAddress,
    liquidatorAddress,
    assetID,
    transferredAmount,
    collateralAssetID,
    minCollateralAmount,
    errorCode,
  };
};
