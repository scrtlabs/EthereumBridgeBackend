import mongoose, { Schema } from "mongoose";

export enum VoteStatus {
  InProgress = "IN PROGRESS",
  Passed = "PASSED",
  Failed = "FAILED",
}

export interface VoteDocument extends mongoose.Document {
  address: string;
  title: string;
  description: string;
  vote_type: string;
  author_addr: string;
  author_alias: string;
  end_timestamp: number;
  quorum: number;
  min_threshold: number;
  choices: string[];
  finalized: boolean;
  valid: boolean;
  status: string;
  reveal_com: {
    n: number;
    revealers: string[];
  }
}

export const VoteSchema = new Schema(
  {
    address: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    vote_type: { type: String, required: true },
    author_addr: { type: String, required: true },
    author_alias: { type: String, required: true },
    end_timestamp: { type: Number, required: true },
    quorum: { type: Number, required: true },
    min_threshold: { type: Number, required: true },
    choices: { type: [String], required: true },
    finalized: { type: Boolean, required: true },
    valid: { type: Boolean, required: true },
    status: { type: String, enum: VoteStatus, required: true },
    reveal_com: {
      n: { type: Number, required: true },
      revealers: { type: [String], required: true },
    },
  },
  { collection: "secret_votes" }
);

export const SecretVotes = mongoose.model<VoteDocument>(
  "secret_vote",
  VoteSchema
);
