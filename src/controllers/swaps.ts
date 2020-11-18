import {Request, Response} from "express";
import {Swap, SwapDocument} from "../models/Swap";
import logger from "../util/logger";
import {Operation, OperationDocument} from "../models/Operation";

export const getAllSwaps = async (req: Request, res: Response) => {
    try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        const swaps = await Swap.find({}, {_id: false, unsigned_tx: false, sequence: false}).sort({ _id: -1 })
        logger.debug(swaps);
        res.json( { swaps: swaps});
    } catch (e) {
        res.status(500);
        res.send(`Error: ${e}`);
    }

};

export const getSwapInfo = async (req: Request, res: Response) => {
    const id = req.params.id
    let swap: SwapDocument;

    const operation: OperationDocument = await Operation.findOne({id: id}, {_id: false})
    if (operation && operation.swap) {
        swap = await Swap.findById(operation.swap);
    } else {
        res.status(404);
        res.send(`Not found`);
    }
    res.json({swap: swap});
};

