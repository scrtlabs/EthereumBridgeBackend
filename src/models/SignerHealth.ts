/* eslint-disable @typescript-eslint/camelcase */
import mongoose from "mongoose";


export interface SignerHealthDocument extends mongoose.Document {
    signer: string,
    health: boolean,
    updated_on: Date,
    from_scrt: boolean,
    to_scrt: boolean,
}

export const signerHealthSchema = new mongoose.Schema({
    signer: String,
    health: Boolean,
    updated_on: Date,
    from_scrt: Boolean,
    to_scrt: Boolean,
}, { collection: "signer_health" });

export const SignerHealth = mongoose.model<SignerHealthDocument>("signer_health", signerHealthSchema);
