import { MAINNET_ASSETS_ID } from "./constants";

export const decimals = {
  jUSDT: 6,
  jUSDC: 6,
  USDT: 6,
  TON: 9,
  stTON: 9,
  tsTON: 9,
};
export const formatAssetsAmount = (
  assetsName: keyof typeof MAINNET_ASSETS_ID,
  amount: number,
) => {
  return `${amount / 10 ** decimals[assetsName]} ${assetsName}`;
};
