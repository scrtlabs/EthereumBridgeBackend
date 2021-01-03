/* eslint-disable @typescript-eslint/camelcase */
import mongoose from "mongoose";

// export interface Token {
//     symbol: string;
//     address: string;
//     decimals: number;
// }

export interface RewardsDocument extends mongoose.Document {
    pool_address: string;
    // inc_token: Token;
    // rewards_token: Token;
    total_locked: string;
    pending_rewards: string;
    deadline: string;
}

export const rewardsSchema = new mongoose.Schema({
    pool_address: String,
    // inc_token: {
    //     symbol: String,
    //     address: String,
    //     decimals: Number
    // },
    // rewards_token: {
    //     symbol: String,
    //     address: String,
    //     decimals: Number
    // },
    total_locked: String,
    pending_rewards: String,
    deadline: String,
}, { collection: "rewards_data" });

export const Rewards = mongoose.model<RewardsDocument>("rewards", rewardsSchema);