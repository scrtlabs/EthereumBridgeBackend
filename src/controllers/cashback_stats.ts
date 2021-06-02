import { Request, Response } from "express";
import logger from "../util/logger";
import {
  CashbackStat,
  StatType,
  CashbackStatDocument,
} from "../models/CashbackStats";

const MAX_RETRIES = 5;

export const getCashbackRate = async (req: Request, res: Response) => {
  try {
    const result = await CashbackStat.findOne({ type: StatType.NetworkAvg });

    res.status(200);
    res.send({ rate: result.avg_rate, count: result.total_count });
  } catch (e) {
    logger.error(`Error getting rate: ${e.message}`);
    res.status(400);
    res.send({ result: "failed" });
    return;
  }
};

export const newCashbackBurn = async (req: Request, res: Response) => {
  const rate = Number(req.params.rate);

  if (isNaN(rate)) {
    res.status(400);
    res.send({ result: "failed", message: "'rate' must be a number" });
    return;
  }

  try {
    const newRate = await updateRate(rate);

    res.status(200);
    res.json({ result: "success", newRate: newRate });
  } catch (e) {
    logger.error(`Error updating rate: ${e.message}`);
    res.status(400);
    res.send({ result: "failed" });
    return;
  }
};

async function updateRate(rateToAdd: number, retries = 0): Promise<number> {
  const currentStat: CashbackStatDocument = await CashbackStat.findOne({
    type: StatType.NetworkAvg,
  });

  if (retries >= MAX_RETRIES) {
    return currentStat.avg_rate;
  }

  let newRate =
    (currentStat.avg_rate * currentStat.total_count + rateToAdd) /
    (currentStat.total_count + 1);

  let res = await CashbackStat.updateOne(
    {
      type: StatType.NetworkAvg,
      avg_rate: currentStat.avg_rate,
      total_count: currentStat.total_count,
    },
    {
      $set: {
        avg_rate: newRate,
        total_count: currentStat.total_count + 1,
      },
    },
    {
      new: true,
    }
  );

  // If the record was updated in the meantime, try again
  if (res.nModified === 0) {
    newRate = await updateRate(rateToAdd, retries + 1);
  }

  return newRate;
}
