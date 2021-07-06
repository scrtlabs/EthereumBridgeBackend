import mongoose, { Schema, Types } from "mongoose";
import UIConnDB from "../database/ui";

export enum StatType {
  NetworkAvg = 'network_avg'
}

export interface CashbackStatDocument extends mongoose.Document {
  type: string;
  avg_rate: number;
  total_count: number;
}

export const CashbackStatSchema = new Schema({
  type: { type: String, enum: StatType, required: true },
  avg_rate: { type: Number, required: true },
  total_count: { type: Number, required: true },
});

export const CashbackStat = UIConnDB.getConn().model<CashbackStatDocument>(
  "cashback_stat",
  CashbackStatSchema
);
