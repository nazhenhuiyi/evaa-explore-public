import { createWallet } from "@ton-community/assets-sdk";
import { internal, toNano } from "@ton/core";
import { mnemonicToWalletKey } from "@ton/crypto";
import { config } from "dotenv";
config();

import { tonClient } from "~/indexer/lib/getUserData";
const keyPair = await mnemonicToWalletKey(
  process.env.WALLET_PRIVATE_KEY!.split(" "),
);

const highloadWallet = tonClient.open(
  createWallet("highload-v2", keyPair.publicKey),
);
console.log(highloadWallet.address);

await highloadWallet.sendTransferAndWait({
  secretKey: keyPair.secretKey,
  messages: [
    internal({
      to: "UQD-ye9SlWViG54GKW6sZL4ORLMKY5nhvvPOZQZQMQ46kfaX",
      value: toNano("0.01"),
    }),
    internal({
      to: "UQD-ye9SlWViG54GKW6sZL4ORLMKY5nhvvPOZQZQMQ46kfaX",
      value: toNano("0.02"),
    }),
    internal({
      to: "UQBP68lMrs_MbsrG54G0twYrNWtEl28myrePNI7FH1TmqYYe",
      value: toNano("0.01"),
    }),
    internal({
      to: "UQBP68lMrs_MbsrG54G0twYrNWtEl28myrePNI7FH1TmqYYe",
      value: toNano("0.02"),
    }),
  ],
});
