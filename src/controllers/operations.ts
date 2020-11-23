import {Request, Response} from "express";
import {Operation, OperationDocument} from "../models/Operation";
import {Swap, SwapDocument, swapSchema, SwapStatus} from "../models/Swap";
import { v4 as uuidv4 } from "uuid";
import logger from "../util/logger";
import {check, validationResult} from "express-validator";

// export const getAllSwaps = async (req: Request, res: Response) => {
//     try {
//         // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
//         const swaps = await Swap.find({}, {_id: false, unsigned_tx: false, sequence: false})
//         logger.debug(swaps);
//         res.json( { swaps: swaps});
//     } catch (e) {
//         res.status(500);
//         res.send(`Error: ${e}`);
//     }
//
// };

export const getOperation = async (req: Request, res: Response) => {

    const id = req.params.operation;

    const operation: OperationDocument = await Operation.findOne({id: id}, {_id: false});
    if (!operation) {
        res.status(404);
        res.send("Not found");
        return;
    }
    let tx: SwapDocument;
    if (operation.swap) {
        tx = await Swap.findById(operation.swap);
    } else if (operation.transactionHash) {
        tx = await Swap.findOne({src_tx_hash: operation.transactionHash});
        if (tx) {
            logger.debug(`found ${tx._id}`)
            const result = await operation.updateOne({swap: tx._id, status: tx.status});
            logger.debug(`updated operation: ${operation.swap}, ${result}`)
        }
    }
    res.json({operation: operation, swap: tx});
};

export const newOperation = async (req: Request, res: Response) => {

    await check("id", "Generated ID cannot be empty").not().isEmpty().run(req);
    await check("transactionHash", "transaction hash cannot be empty").not().isEmpty().run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error(`Error: ${JSON.stringify(errors.array())}`);
        res.status(400);
        res.send({result: "failed", message: errors.array()});
        return;
    }
    const operation = new Operation({
        id: req.body.id,
        transactionHash: req.body.transactionHash,
        status: SwapStatus.SWAP_NOT_EXIST
    });

    await operation.save();
    console.log("cya");
    res.json({operation});
};

export interface IOperation {
    id: string;
    status: STATUS;
    amount: number;
    fee: number;
    ethAddress: string;
    oneAddress: string;
    actions: Array<IAction>;
    timestamp: number;
    erc20Address?: string;
}

export interface IAction {
    id: string;
    type: ACTION_TYPE;
    status: STATUS;
    transactionHash: string;
    error: string;
    message: string;
    timestamp: number;
    payload: any;
}

export enum STATUS {
    ERROR = "error",
    SUCCESS = "success",
    WAITING = "waiting",
    IN_PROGRESS = "in_progress",
}

export enum ACTION_TYPE {
    // ETH_TO_ONE
    "getHRC20Address" = "getHRC20Address",
    "approveEthManger" = "approveEthManger",
    "lockToken" = "lockToken",
    "waitingBlockNumber" = "waitingBlockNumber",
    "mintToken" = "mintToken",
    "mintTokenRollback" = "mintTokenRollback",

    // ONE_TO_ETH
    "approveHmyManger" = "approveHmyManger",
    "burnToken" = "burnToken",
    "waitingBlockNumberHarmony" = "waitingBlockNumberHarmony",
    "unlockToken" = "unlockToken",
    "unlockTokenRollback" = "unlockTokenRollback",
}
