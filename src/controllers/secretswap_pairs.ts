import {Request, Response} from "express";
import Cache from "../util/cache";
import {
  SecretSwapPairs,
  SecretSwapPairDocument,
} from "../models/SecretSwapPair";

const cache = Cache.getInstance();

// import {check, validationResult} from "express-validator";
// import logger from "../util/logger";

export const getSecretSwapPairs = async (req: Request, res: Response) => {
    const pairs:  SecretSwapPairDocument[] = await cache.get("secretswap_pairs", async () => {
        return SecretSwapPairs.find({}, { _id: false });
    });

    try {
        res.json( { pairs: pairs });
    } catch (e) {
        res.status(500);
        res.send(`Error: ${e}`);
    }

};

// export const getToken = async (req: Request, res: Response) => {
//     const token: string = req.params.token;
//     const pair: PairingDocument = await cache.get(token, async () => Pairing.find({src_coin: token}, {_id: false}));

//     // eslint-disable-next-line @typescript-eslint/camelcase
//     //const pair = await Pairing.findOne({src_coin: token});
//     if (!pair) {
//         res.status(404);
//     } else {
//         res.json({token: pair});
//     }
// };

