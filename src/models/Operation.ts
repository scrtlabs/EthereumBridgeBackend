/* eslint-disable @typescript-eslint/camelcase */
import mongoose, { Schema, Types } from "mongoose";
import { SwapDocument, Swap } from "./Swap";

export interface OperationDocument extends mongoose.Document {
  id: string;
  status: number;
  transactionHash?: string;
  ethAddress?: string;
  secretAddress?: string;
  asset?: string;
  amount?: string;
  swap?: SwapDocument["_id"]; //string | typeof Types.ObjectId;
}

export const operationSchema = new Schema({
  id: String,
  status: Number,
  //{
  //  type: Number,
    // get: (value: number) => SwapStatus[value],
    // set: (status: SwapStatus) => status.valueOf(),
  //},
  swap: {
    required: false,
    type: Schema.Types.ObjectId,
    ref: "swap",
  },
  transactionHash: String,
  ethAddress: { type: String, required: false },
  secretAddress: { type: String, required: false },
  asset: { type: String, required: false },
  amount: { type: String, required: false },
});

export const Operation = mongoose.model<OperationDocument>(
  "operation",
  operationSchema
);
