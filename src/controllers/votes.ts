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
    vote_type: string;
    author_addr: string;
    author_alias: string;
  };
  config: {
    end_timestamp: number;
    quorum: number;
    min_threshold: number;
    choices: string[];
    finalized: boolean;
    valid: boolean;
  };
}

interface Tally {
  choices: string[];
  tally: string[];
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
      vote_type: voteInfo.metadata.vote_type,
      author_addr: voteInfo.metadata.author_addr,
      author_alias: voteInfo.metadata.author_alias,
      end_timestamp: voteInfo.config.end_timestamp,
      quorum: voteInfo.config.quorum,
      min_threshold: voteInfo.config.min_threshold,
      choices: voteInfo.config.choices,
      finalized: voteInfo.config.finalized,
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

  let info_resp: { vote_info: VoteInfo };
  try {
    info_resp = await queryClient.queryContractSmart(
      newVoteAddr,
      queryVoteInfo()
    );
  } catch (err) {
    const error = `Error querying voting contract ${newVoteAddr}`;
    logger.error(error);
    logger.error(JSON.stringify(err));

    res.status(400);
    res.send({ result: error, error: JSON.stringify(err) });

    return;
  }

  const voteInfo = info_resp.vote_info;

  if (!voteInfo.config.finalized) {
    const error = `Vote ${newVoteAddr} has not been finalized yet`;
    logger.error(error);

    res.status(200);
    res.send({ result: error });
    return;
  }

  let voteStatus: VoteStatus;
  if (!voteInfo.config.valid) {
    voteStatus = VoteStatus.Failed;
  } else {
    let tally_resp: { tally: Tally };
    try {
      tally_resp = await queryClient.queryContractSmart(
        newVoteAddr,
        queryTally()
      );
    } catch (err) {
      const error = `Error querying tally for ${newVoteAddr}`;
      logger.error(error);
      logger.error(JSON.stringify(err));

      res.status(400);
      res.send({ result: error, error: JSON.stringify(err) });
      return;
    }

    voteStatus = getStatus(tally_resp.tally);
  }

  try {
    const vote: VoteDocument = await SecretVotes.findOneAndUpdate(
      {
        address: newVoteAddr,
      },
      {
        ended: voteInfo.config.finalized,
        valid: voteInfo.config.valid,
        status: voteStatus,
      }
    ).orFail();

    if (vote === null) {
      throw "no votes updated";
    }
  } catch (e) {
    const error = `Could note update vote ${newVoteAddr}`;
    logger.error(error);
    logger.error(e);

    res.status(400);
    res.send({ result: error, error: e });

    return;
  }

  res.status(200);
  res.send();
};

// Helper functions

const queryVoteInfo = () => {
  return { vote_info: {} };
};

const queryTally = () => {
  return { tally: {} };
};

const getStatus = (tally: Tally): VoteStatus => {
  if (
    tally.choices.includes("no") &&
    tally.choices.includes("yes") &&
    tally.choices.length === 2
  ) {
    const no_tally = Number(tally.tally[tally.choices.indexOf("no")]);
    const yes_tally = Number(tally.tally[tally.choices.indexOf("yes")]);

    if (yes_tally <= no_tally) {
      return VoteStatus.Failed;
    }
  }

  return VoteStatus.Passed; // If not only yes/no => always passed
};
