import {
  Address,
  beginCell,
  Cell,
  Contract,
  ContractProvider,
  Dictionary,
  Sender,
  SendMode,
} from "@ton/core";
import { MAINNET_ASSETS_ID } from "~/indexer/lib/constants";
import {
  AssetConfig,
  calculateLiquidationData,
  ExtendedAssetData,
} from "@evaafi/sdk";
/**
 * User contract wrapper
 */
export class EvaaUser implements Contract {
  readonly address: Address;
  readonly testnet: boolean = false;

  /**
   * Create user contract wrapper from address
   * @param address user contract address
   * @param testnet testnet flag
   */
  static createFromAddress(address: Address, testnet = false) {
    return new EvaaUser(address, testnet);
  }

  private constructor(address: Address, testnet = false) {
    this.address = address;
    this.testnet = testnet;
  }
  async getSync(
    provider: ContractProvider,
    assetsData: Dictionary<bigint, ExtendedAssetData>,
    assetsConfig: Dictionary<bigint, AssetConfig>,
    prices: Dictionary<bigint, bigint>,
  ) {
    const state = (await provider.getState()).state;
    if (state.type === "active") {
      const userDataBOC = state.data!.toString("base64url");
      const userSlice = Cell.fromBase64(userDataBOC).beginParse();

      const codeVersion = userSlice.loadCoins();
      const masterAddress = userSlice.loadAddress();
      const userAddress = userSlice.loadAddress();
      const principalsDict = userSlice.loadDict(
        Dictionary.Keys.BigUint(256),
        Dictionary.Values.BigInt(64),
      );
      const userState = userSlice.loadInt(64);
      const trackingSupplyIndex = userSlice.loadUintBig(64);
      const trackingBorrowIndex = userSlice.loadUintBig(64);
      const dutchAuctionStart = userSlice.loadUint(32);
      userSlice.loadRef();
      userSlice.endParse();
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
          const assetConfig = assetsConfig.get(assetID)!;
          const principals = principalsDict.get(assetID) ?? 0n;

          if (principals > -assetConfig.dust && principals < assetConfig.dust) {
            userBalances[key as unknown as keyof typeof MAINNET_ASSETS_ID] = 0n;
          } else {
            userBalances[key as unknown as keyof typeof MAINNET_ASSETS_ID] =
              principals;
          }
        }
      }
      const liquidateData = calculateLiquidationData(
        assetsConfig,
        assetsData,
        principalsDict,
        prices,
      );
      const healthFactor =
        liquidateData.totalDebt === 0n
          ? 1
          : 1 -
            Number(liquidateData.totalDebt) / Number(liquidateData.totalLimit);

      return {
        codeVersion,
        masterAddress,
        userAddress,
        userBalances,
        userState,
        trackingSupplyIndex,
        trackingBorrowIndex,
        dutchAuctionStart,
        userDataBOC,
        healthFactor,
        totalDebt: liquidateData.totalDebt,
      };
    }
    return null;
  }
}
