import {Request, Response} from "express";
import {Pairing, PairingDocument} from "../models/Pairing";
import Cache from "../util/cache";
import config from "../util/config";
import {getErcBalance, getEthBalance} from "../blockchain/eth";

const cache = Cache.getInstance();

// import {check, validationResult} from "express-validator";
// import logger from "../util/logger";

export const getTokenPairings = async (req: Request, res: Response) => {
    let pairs: PairingDocument[] = await cache.get('pairs', async () => {
        let pairs = await Pairing.find({}, {_id: false})
        return await Promise.all(pairs.map(async (pair) => {
            pair.symbol = pair.src_coin;
            pair.name = pair.src_coin;
            pair.decimals = 18
            if (pair.src_address === 'native') {
                pair.totalLocked = await getEthBalance(config.walletAddress).catch(
                    () => "0"
                );
                pair.totalLockedNormal = (Number.parseInt(pair.totalLocked) / 1e18).toString();
                pair.totalLockedUSD = (Number.parseInt(pair.totalLocked) / 1e18 * 450).toString(10);
            } else {
                pair.totalLocked = await getErcBalance(config.walletAddress, pair.src_address).catch(
                    () => "0"
                );
                // pair.totalLockedUSD = (Number.parseInt(pair.totalLocked) / 1e18 * 450).toString(10)
                pair.totalLockedUSD = "0";
                pair.totalLockedNormal = "0";
            }
            return pair;

        }));
    });

    try {
        res.json( { tokens: pairs });
    } catch (e) {
        res.status(500);
        res.send(`Error: ${e}`);
    }

};

export const getToken = async (req: Request, res: Response) => {
    const token: string = req.params.token;
    const pair: PairingDocument = await cache.get(token, async () => Pairing.find({src_coin: token}, {_id: false}));

    // eslint-disable-next-line @typescript-eslint/camelcase
    //const pair = await Pairing.findOne({src_coin: token});
    if (!pair) {
        res.status(404);
    } else {
        res.json({token: pair});
    }
};

