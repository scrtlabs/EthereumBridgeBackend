/* eslint-disable @typescript-eslint/camelcase */
import mongoose from "mongoose";

export interface Token {
  token: {
    contract_addr: string;
    token_code_hash: string;
    viewing_key: string;
  };
}

export interface NativeToken {
  native_token: {
    denom: string;
  };
}
export interface SecretSwapPairDocument extends mongoose.Document {
  asset_infos: Array<Token | NativeToken>;
  contract_addr: string;
  liquidity_token: string;
  token_code_hash: string;
  asset0_volume: string;
  asset1_volume: string;
  factory: {
    address: string;
    code_hash: string;
  };
}

export const secretSwapPairSchema = new mongoose.Schema(
  {
    asset_infos: [
      {
        token: {
          contract_addr: String,
          token_code_hash: String,
          viewing_key: String,
        },
        native_token: {
          denom: String,
        },
      },
    ],
    contract_addr: String,
    liquidity_token: String,
    token_code_hash: String,
    asset0_volume: String,
    asset1_volume: String,
    factory: {
      address: String,
      code_hash: String,
    },
  },
  { collection: "secretswap_pairs" }
);

// userSchema.pre("save", function save(next) {
//     const user = this as UserDocument;
//     if (user.isModified("uid")) { return next(); }
//     user.uid = generateApiKey();
//     return next();
// });

export const SecretSwapPairs = mongoose.model<SecretSwapPairDocument>(
  "secretswap_pairs",
  secretSwapPairSchema
);
