/* eslint-disable @typescript-eslint/camelcase */
import mongoose from "mongoose";
import UIConnDB from "../database/ui";
import SwapConnDB from "../database/secretswap";

type TOKEN_USAGE = "BRIDGE" | "REWARDS" | "LPSTAKING";


export interface TokenDocument extends mongoose.Document {
    name: string;
    address: string;
    decimals: number;
    price: string;
    usage: TOKEN_USAGE[];
    id: string;
    hidden: boolean;
    display_props: object;
}


export const tokenSchema = new mongoose.Schema({
    name: String,
    address: String,
    decimals: {
        type: Number,
        default: 6,
    },
    id: String,
    price: String,
    symbol: String,
    usage: Array,
    hidden: Boolean,
}, { collection: "secret_tokens" });

// userSchema.pre("save", function save(next) {
//     const user = this as UserDocument;
//     if (user.isModified("uid")) { return next(); }
//     user.uid = generateApiKey();
//     return next();
// });
export const Tokens = SwapConnDB.getConn().model<TokenDocument>("secret_tokens", tokenSchema);
