/* eslint-disable @typescript-eslint/camelcase */
import mongoose from "mongoose";

export interface TokenPool {
  info: {
    token: {
      contract_addr: string;
      token_code_hash: string;
      viewing_key: string;
    };
  };
  amount: string;
}

export interface NativeTokenPool {
  info: {
    native_token: {
      denom: string;
    };
  };
  amount: string;
}
export interface SecretSwapPoolDocument extends mongoose.Document {
  assets: Array<TokenPool | NativeTokenPool>;
  total_share: string;
}

export const secretSwapPoolSchema = new mongoose.Schema(
  {},
  { collection: "secretswap_pools" }
);

export const SecretSwapPools = mongoose.model<SecretSwapPoolDocument>(
  "secretswap_pools",
  secretSwapPoolSchema
);
