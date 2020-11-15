import {Request, Response} from "express";
import {Pairing} from "../models/Pairing";

// import {check, validationResult} from "express-validator";
// import logger from "../util/logger";

export const getTokenPairings = async (req: Request, res: Response) => {

    try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        const pairs = await Pairing.find({}, {_id: false});
        pairs.map(pair => {
            pair.symbol = pair.src_coin;
            pair.name = pair.src_coin;
        })
        res.json( { tokens: pairs });
    } catch (e) {
        res.status(500);
        res.send(`Error: ${e}`);
    }

};

export const getToken = async (req: Request, res: Response) => {
    const token: string = req.params.token;
    // eslint-disable-next-line @typescript-eslint/camelcase
    const pair = await Pairing.findOne({src_coin: token});
    if (!pair) {
        res.status(404);
    } else {
        res.json({token: pair});
    }
};

export const getTotalStored = async (req: Request, res: Response) => {

    try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        const pairs = await Pairing.find({});
        res.json( { tokens: pairs });
    } catch (e) {
        res.status(500);
        res.send(`Error: ${e}`);
    }

};
