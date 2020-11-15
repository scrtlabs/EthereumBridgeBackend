/* eslint-disable @typescript-eslint/camelcase */
import mongoose from "mongoose";


export interface PairingDocument extends mongoose.Document {
    name: string;
    decimals: number;
    symbol: string;
    dst_address: string;
    dst_coin: string;
    dst_network: string;
    src_address: string;
    src_coin: string;
    src_network: string;
}


export const pairingSchema = new mongoose.Schema({
    dst_address: String,
    dst_coin: String,
    dst_network: String,
    src_address: String,
    src_coin: String,
    src_network: String,
    name: String,
    symbol: String,
    decimals: {
        type: Number,
        default: 18,
    },
}, { collection: 'token_pairing' });

// userSchema.pre("save", function save(next) {
//     const user = this as UserDocument;
//     if (user.isModified("uid")) { return next(); }
//     user.uid = generateApiKey();
//     return next();
// });

export const Pairing = mongoose.model<PairingDocument>("token_pairing", pairingSchema);
