import {Request, Response} from "express";
import {Operation, OperationDocument} from "../models/Operation";
import {Swap, SwapDocument, swapSchema, SwapStatus} from "../models/Swap";
import { v4 as uuidv4 } from "uuid";
import logger from "../util/logger";
import {check, validationResult} from "express-validator";

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
            const result = await Operation.updateOne({id: id}, {swap: tx._id, status: tx.status});

            if (result.error) {
                logger.debug(`failed to update operation ${id}: with swap ${tx._id}: ${JSON.stringify(result.error)}`)
            } else {
                logger.debug(`Updated operation ${id}: with swap ${tx._id} successfully`)
            }
        }
    }
    res.json({operation, swap: tx});
};

export const newOperation = async (req: Request, res: Response) => {

    await check("id", "Generated ID cannot be empty").not().isEmpty().run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error(`Error: ${JSON.stringify(errors.array())}`);
        res.status(400);
        res.send({result: "failed", message: errors.array()});
        return;
    }


    let operation = new Operation({
        id: req.body.id,
        status: SwapStatus.SWAP_WAIT_SEND
    });

    if (req.body.transactionHash) {
        operation.transactionHash = req.body.transactionHash;
    }

    await operation.save();
    res.json({operation});
};

export const updateOperation = async (req: Request, res: Response) => {

    await check("transactionHash", "transactionHash cannot be empty").not().isEmpty().run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error(`Error updating transaction: ${JSON.stringify(errors.array())}`);
        res.status(400);
        res.send({result: "failed", message: errors.array()});
        return;
    }

    let resp = await Operation.updateOne({id: req.params.operation},
        {transactionHash: req.body.transactionHash, status: SwapStatus.SWAP_NOT_EXIST});
    if (resp.error) {
        logger.error(`Error updating transaction: ${JSON.stringify(resp.error)}`);
        res.status(400);
        res.send({result: "failed", message: resp.error});
        return;
    }

    res.json({result: "success"})
};
