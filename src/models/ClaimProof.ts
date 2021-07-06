/* eslint-disable @typescript-eslint/camelcase */
import mongoose from "mongoose";
import UIConnDB from "../database/ui";

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

export const EthClaimProofs = UIConnDB.getConn().model<ClaimProofDocument>("eth_claim_proof", ethProofSchema);

export const scrtProofSchema = new mongoose.Schema({
  user: String,
  index: Number,
  amount: String,
  proof: [String],
}, { collection: "airdrop_merkle_secret" });

export const ScrtClaimProofs = UIConnDB.getConn().model<ClaimProofDocument>("scrt_claim_proof", scrtProofSchema);
