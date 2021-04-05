import { Request, Response } from "express";
import Cache from "../util/cache";
import {
  SecretSwapPairs,
  SecretSwapPairDocument,
} from "../models/SecretSwapPair";

//import sushiData from '@sushiswap/sushi-data';

const cache = Cache.getInstance();

// import {check, validationResult} from "express-validator";
// import logger from "../util/logger";

export const getSecretSwapPairs = async (req: Request, res: Response) => {
  const pairs: SecretSwapPairDocument[] = await cache.get(
    "secretswap_pairs",
    async () => {
      return SecretSwapPairs.find({}, { _id: false });
    }
  );

  try {
    res.json({ pairs: pairs });
  } catch (e) {
    res.status(500);
    res.send(`Error: ${e}`);
  }
};

// export const getSushiPool = async (req: Request, res: Response) => {
//     const address: string = req.params.address;
//
//     sushiData.masterchef.pool({ pool_address: address, pool_id: undefined }).then(pool => {
//         try {
//             res.json(pool);
//         } catch (e) {
//             res.status(500);
//             res.send(`Error: ${e}`);
//         }
//     })
// };
