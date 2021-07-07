import { Request, Response } from "express";
import logger from "../util/logger";
import {} from "../models/CashbackStats";
import { SecretVotes, VoteDocument, VoteStatus } from "../models/SecretVote";
import { CosmWasmClient } from "secretjs";
import config from "../util/config";

interface VoteInfo {
  metadata: {
    title: string;
    description: string;
    author_addr: string;
    author_alias: string;
  };
  config: {
    end_timestamp: number;
    quorum: number;
    min_threshold: number;
    choices: string[];
    ended: boolean;
    valid: boolean;
  };
}

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

export const newVote = async (req: Request, res: Response) => {
  const newVoteAddr = req.params.voteAddr;
  const queryClient = new CosmWasmClient(config.secretNodeUrl);

  let resp: { vote_info: VoteInfo };
  try {
    resp = await queryClient.queryContractSmart(newVoteAddr, queryVoteInfo());
  } catch (err) {
    const error = `Error querying voting contract ${newVoteAddr}`;
    logger.error(error);
    logger.error(JSON.stringify(err));

    res.status(400);
    res.send({ result: error, error: JSON.stringify(err) });

    return;
  }

  const voteInfo = resp.vote_info;

  const vote: VoteDocument = await SecretVotes.findOne({
    address: newVoteAddr,
  }).exec();

  if (vote !== null) {
    const error = `Voting contract ${newVoteAddr} already exists`;
    logger.error(error);

    res.status(400);
    res.send({ result: error });

    return;
  }

  const result = await SecretVotes.insertMany([
    {
      address: newVoteAddr,
      title: voteInfo.metadata.title,
      description: voteInfo.metadata.description,
      author_addr: voteInfo.metadata.author_addr,
      author_alias: voteInfo.metadata.author_alias,
      end_timestamp: voteInfo.config.end_timestamp,
      quorum: voteInfo.config.quorum,
      min_threshold: voteInfo.config.min_threshold,
      choices: voteInfo.config.choices,
      ended: voteInfo.config.ended,
      valid: voteInfo.config.valid,
      status: VoteStatus.InProgress,
    },
  ]);

  if (result.length === 0) {
    const error = `Unable to add voting contract ${newVoteAddr}`;
    logger.error(error);

    res.status(400);
    res.send({ result: error });

    return;
  }

  res.status(200);
  res.send();
};

export const finalizeVote = async (req: Request, res: Response) => {
  const newVoteAddr = req.params.voteAddr;
  const queryClient = new CosmWasmClient(config.secretNodeUrl);

  let resp: { vote_info: VoteInfo };
  try {
    resp = await queryClient.queryContractSmart(newVoteAddr, queryVoteInfo());
  } catch (err) {
    const error = `Error querying voting contract ${newVoteAddr}`;
    logger.error(error);
    logger.error(JSON.stringify(err));

    res.status(400);
    res.send({ result: error, error: JSON.stringify(err) });

    return;
  }

  const voteInfo = resp.vote_info;

  if (!voteInfo.config.ended) {
    const error = `Vote ${newVoteAddr} has not been finalized yet`;
    logger.error(error);

    res.status(400);
    res.send({ result: error });
    return;
  }

  try {
    const vote: VoteDocument = await SecretVotes.findOneAndUpdate(
      {
        address: newVoteAddr,
      },
      {
        ended: voteInfo.config.ended,
        valid: voteInfo.config.valid,
        status: voteInfo.config.valid ? VoteStatus.Passed : VoteStatus.Failed,
      }
    ).orFail();

    if (vote === null) {
      throw "no votes updated";
    }
  } catch (e) {
    const error = `Could note update vote ${newVoteAddr}`;
    logger.error(error);

    res.status(400);
    res.send({ result: error });

    return;
  }

  res.status(200);
  res.send();
};

// Helper functions

const queryVoteInfo = () => {
  return { vote_info: {} };
};
