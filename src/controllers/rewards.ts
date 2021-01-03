import {Request, Response} from "express";
import { RewardsDocument, Rewards } from "../models/Rewards";
import Cache from "../util/cache";

const cache = Cache.getInstance();

export const getRewardPools = async (req: Request, res: Response) => {
    const pools: RewardsDocument[] = await cache.get("rewards", async () => {
        return Rewards.find({}, {_id: false});
    });

    try {
        res.json( { pools: pools });
    } catch (e) {
        res.status(500);
        res.send(`Error: ${e}`);
    }

};

export const getPool = async (req: Request, res: Response) => {
    const poolAddr = req.params.pool;
    // eslint-disable-next-line @typescript-eslint/camelcase
    const pools: RewardsDocument = await cache.get(poolAddr, async () => Rewards.findOne({pool_address: poolAddr}, {_id: false}));

    try {
        res.json( { pool: pools });
    } catch (e) {
        res.status(500);
        res.send(`Error: ${e}`);
    }

};