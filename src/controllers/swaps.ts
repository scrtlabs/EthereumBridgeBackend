import {Request, Response} from "express";
import {Swap, SwapDocument} from "../models/Swap";
import logger from "../util/logger";
import {Operation, OperationDocument} from "../models/Operation";

export const getAllSwaps = async (req: Request, res: Response) => {
    logger.debug('getAllSwaps');
    try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        const swaps = await Swap.find({}, {_id: false, unsigned_tx: false, sequence: false}).sort({ _id: -1 }).limit(100);
        res.json( { swaps: swaps});
    } catch (e) {
        res.status(500);
        res.send(`Error: ${e}`);
    }

};

export const getSwapInfo = async (req: Request, res: Response) => {
    const id = req.params.swap;
    let swap: SwapDocument;

    const operation: OperationDocument = await Operation.findOne({id: id}, {_id: false});
    if (operation && operation.swap) {
        swap = await Swap.findById(operation.swap);
        res.json({swap: swap});
    } else if (operation) {
        swap = await Swap.findOne({src_tx_hash: operation.transactionHash});
        res.json({swap: swap})
    } else {
        res.status(404);
        res.send("Not found");
    }
};

