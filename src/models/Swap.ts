/* eslint-disable @typescript-eslint/camelcase */
import mongoose from "mongoose";
import BridgeConnDB from "../database/bridge";

export enum SwapStatus {
    SWAP_UNSIGNED = 1,
    SWAP_SIGNED,
    SWAP_SUBMITTED,
    SWAP_CONFIRMED,
    SWAP_FAILED,
    SWAP_RETRY,
    SWAP_WAIT_SEND,
    SWAP_NOT_EXIST = 9
}


export interface SwapDocument extends mongoose.Document {
    created_on: Date;
    updated_on: Date;
    dst_coin: string;
    dst_network: string;
    dst_tx_hash: string;
    amount: number;
    src_address: string;
    src_coin: string;
    src_network: string;
    src_tx_hash: string;
    status: number;
    _id: string;
}

export const swapSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        auto: true,
    },
    created_on: Date,
    updated_on: Date,
    dst_coin: String,
    dst_network: String,
    dst_tx_hash: String,
    amount: Number,
    src_address: String,
    src_coin: String,
    src_network: String,
    src_tx_hash: String,
    status: {
        type: Number,
        //get: (value: number) => SwapStatus[value],
        //set: (status: SwapStatus) => status.valueOf(),
    },
}, { collection: "swap" });

export const Swap = BridgeConnDB.getConn().model<SwapDocument>("swap", swapSchema);
