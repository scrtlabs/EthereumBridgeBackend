import {Request, Response} from "express";
import {Swap} from "../models/Swap";
import logger from "../util/logger";

export const getAllSwaps = async (req: Request, res: Response) => {
    try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        const swaps = await Swap.find({}, {_id: false, unsigned_tx: false, sequence: false})
        logger.debug(swaps);
        res.json( { swaps: swaps});
    } catch (e) {
        res.status(500);
        res.send(`Error: ${e}`);
    }

};

export const getSwapInfo = async (req: Request, res: Response) => {
    const srcHash: string = req.params.swap;
    // eslint-disable-next-line @typescript-eslint/camelcase
    const swap = await Swap.findOne({src_tx_hash: srcHash});
    if (!swap) {
        res.status(404);
    } else {
        res.json({swap: swap});
    }
};

