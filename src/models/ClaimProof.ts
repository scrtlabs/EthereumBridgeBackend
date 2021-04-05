/* eslint-disable @typescript-eslint/camelcase */
import mongoose from "mongoose";

export interface ClaimProofDocument extends mongoose.Document {
  user: string;
  index: Number;
  amount: string;
  proof: [String];
}

export const ethProofSchema = new mongoose.Schema({
  user: String,
  index: Number,
  amount: String,
  proof: [String],
}, { collection: "airdrop_merkle" });

export const EthClaimProofs = mongoose.model<ClaimProofDocument>("eth_claim_proof", ethProofSchema);

export const scrtProofSchema = new mongoose.Schema({
  user: String,
  index: Number,
  amount: String,
  proof: [String],
}, { collection: "airdrop_merkle_secret" });

export const ScrtClaimProofs = mongoose.model<ClaimProofDocument>("scrt_claim_proof", scrtProofSchema);