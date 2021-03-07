import {Request, Response} from "express";
import Cache from "../util/cache";
import {
    SignerHealth,
    SignerHealthDocument,
} from "../models/SignerHealth";

const cache = Cache.getInstance();

export const getSignerHealth = async (req: Request, res: Response) => {
    const health:  SignerHealthDocument[] = await cache.get("signer_health", async () => {
        return SignerHealth.find({}, { _id: false });
    });

    try {
        res.json( { health });
    } catch (e) {
        res.status(500);
        res.send(`Error: ${e}`);
    }

};
