import { Address } from "@ton/core";

import { JETTON_WALLETS, MAINNET_ASSETS_ID } from "~/indexer/lib/constants";

export const getAssetsNameByAddress = (address: string) => {
  const addr = Address.parse(address).toString({
    urlSafe: true,
    bounceable: true,
  });
  console.log(addr);
  return JETTON_WALLETS[addr as unknown as keyof typeof JETTON_WALLETS];
};
export const getAssetsNameByAssetId = (AssetId: bigint) => {
  if (
    AssetId ===
    50850501484409962260436158254568659042079041098295833093775185384452361044705n
  )
    return "jUSDT";
  if (
    AssetId ===
    59757588766621668873077634021023468123869778502582394337130388226650466113215n
  )
    return "jUSDC";
  return Object.keys(MAINNET_ASSETS_ID).filter((key) => {
    if (MAINNET_ASSETS_ID[key as keyof typeof MAINNET_ASSETS_ID] === AssetId) {
      return key;
    }
  })[0];
};
// console.log(
//   getAssetsName(
//     "0:706c5d28b712f203756b4638c2d6aee2dc6ecbb68129772063644b8db6b842e1",
//   ),
// );
