/* eslint-disable @typescript-eslint/camelcase */
import mongoose, {Schema} from "mongoose";
import {SwapStatus} from "./Swap";


export interface OperationDocument extends mongoose.Document {
    id: string;
    status: number;
    transactionHash: string;
    swap?: Schema.Types.ObjectId;
}


export const operationSchema = new Schema({
    id: String,
    status: {
        type: Number,
        // get: (value: number) => SwapStatus[value],
        // set: (status: SwapStatus) => status.valueOf(),
    },
    swap:{
        required: false,
        type: Schema.Types.ObjectId,
        ref: "swap"},
    transactionHash: String,
});


export const Operation = mongoose.model<OperationDocument>("operation", operationSchema);
