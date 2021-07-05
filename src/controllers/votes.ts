import { Request, Response } from "express";
import logger from "../util/logger";
import {} from "../models/CashbackStats";
import { SecretVotes } from "../models/SecretVote";

export const getAllVotes = async (req: Request, res: Response) => {
  try {
    const votes = await SecretVotes.find();

    res.status(200);
    res.send({ result: votes });
  } catch (e) {
    logger.error(`Error getting rate: ${e.message}`);

    res.status(400);
    res.send({ result: "failed" });
    return;
  }
};
