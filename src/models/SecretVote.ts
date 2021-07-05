import mongoose, { Schema } from "mongoose";

export interface VoteDocument extends mongoose.Document {
  address: string;
  title: string;
  description: string;
  author_addr: string;
  author_alias: string;
  end_timestamp: number;
  quorum: number;
  min_threshold: number;
  choices: string[];
}

export const VoteSchema = new Schema({
  address: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  author_addr: { type: String, required: true },
  author_alias: { type: String, required: true },
  end_timestamp: { type: Number, required: true },
  quorum: { type: Number, required: true },
  min_threshold: { type: Number, required: true },
  choices: { type: [String], required: true },
});

export const SecretVotes = mongoose.model<VoteDocument>(
  "secret_vote",
  VoteSchema
);
