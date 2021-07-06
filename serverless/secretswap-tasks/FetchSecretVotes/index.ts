/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable camelcase */

import { AzureFunction, Context } from "@azure/functions";
import { MongoClient, Collection } from "mongodb";
import { CosmWasmClient } from "secretjs";

// Env vars
const secretNodeURL: string = process.env["secretNodeURL"];
const mongodbName: string = process.env["mongodbName"];
const mongodbUrl: string = process.env["mongodbUrl"];
const voteCodeId: number = Number(process.env["voteCodeId"]);
const voteFactoryAddr: string = process.env["voteFactoryAddr"];

const votesCollection: string = "secret_votes"

interface Vote {
    address: string;
    title: string;
    description: string;
    author_addr: string;
    author_alias: string;
    end_timestamp: number;
    quorum: number;
    min_threshold: number;
    choices: string[];
}

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

const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
    const queryClient = new CosmWasmClient(secretNodeURL);
    let voteContracts = await queryClient.getContracts(voteCodeId);

    const mongoClient = await createMongoClient(context);
    const dbCollection: Collection<Vote> = mongoClient.db(mongodbName).collection(votesCollection);
    const voteAddresses = (await dbCollection.find().toArray()).map(v => v.address);

    // Take only those that don't exist on the db yet
    const votesToAdd = voteContracts
        .filter(c => c.creator === voteFactoryAddr)
        .filter(c => !voteAddresses.includes(c.address));

    votesToAdd.forEach(vote => {
        context.log(`Querying VoteInfo for ${vote.address} ..`);
        queryClient.queryContractSmart(vote.address, queryInfo()).then(function (resp: { "vote_info": VoteInfo }) {
            const voteInfo = resp.vote_info;
            context.log(`Successfully queried vote ${vote.address}`);
            context.log(`result is: ${JSON.stringify(voteInfo)}`);

            const voteToSave: Vote = {
                address: vote.address,
                title: voteInfo.metadata.title,
                description: voteInfo.metadata.description,
                author_addr: voteInfo.metadata.author_addr,
                author_alias: voteInfo.metadata.author_alias,
                end_timestamp: voteInfo.config.end_timestamp,
                quorum: voteInfo.config.quorum,
                min_threshold: voteInfo.config.min_threshold,
                choices: voteInfo.config.choices
            };
            dbCollection.insertOne(voteToSave).then(
                () => context.log(`Saved vote ${vote.address} to db`),
                (error) => context.log(`Couldn't save vote ${vote.address} to db`)
            );
        }, function (error) {
            context.log(`Failed to query vote info for ${vote.address}: ${error}`);
        })
    });

    await sleep(30000); // Give the asynchronous logs time to print
};

const createMongoClient = function (context: Context): Promise<MongoClient> {
    const client: Promise<MongoClient> = MongoClient.connect(mongodbUrl, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
    }).catch((err: any) => {
        context.log(err);
        throw new Error("Failed to connect to database");
    });

    return client;
}

const queryInfo = function () {
    return { "vote_info": {} }
}

// Promise helper
const reflect = p => p.then(v => ({ v, status: "fulfilled" }),
    e => ({ e, status: "rejected" }));

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export default timerTrigger;
