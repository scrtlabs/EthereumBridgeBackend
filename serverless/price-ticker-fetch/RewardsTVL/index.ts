/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable camelcase */

import { AzureFunction, Context } from "@azure/functions";
import { MongoClient } from "mongodb";
import { CosmWasmClient, EnigmaUtils } from "secretjs";

interface Token {
    symbol: string;
    address: string;
    decimals: number;
}

interface RewardPoolData {
    pool_address: string;
    inc_token: Token;
    rewards_token: Token;
    total_locked: string;
    pending_rewards: string;
    deadline: string;
}

function queryDeadline() {
    return {
        end_height: {},
    };
}

function queryRewardPool() {
    return {
        reward_pool_balance: {}
    };
}

function querySnip20Balance(address: string, key: string) {
    return {
        balance: {
            address: address,
            key: key
        }
    };
}

const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
    const client: MongoClient = await MongoClient.connect(`${process.env["mongodbUrl"]}`).catch(
        (err: any) => {
            context.log(err);
            throw new Error("Failed to connect to database");
        }
    );
    const db = await client.db(`${process.env["mongodbName"]}`);
    const pools = await db.collection("rewards_data").find({});

    const seed = EnigmaUtils.GenerateNewSeed();
    const queryClient = new CosmWasmClient(`${process.env["secretNodeURL"]}`, seed);

    pools.forEach(async (pool: RewardPoolData) => {
        const poolAddr = pool.pool_address;
        const incTokenAddr = pool.inc_token.address;

        // Query chain for things needed to be updated
        let rewardsBalance, incBalance, deadline;
        const queries = [
            queryClient.queryContractSmart(poolAddr, queryRewardPool()),
            queryClient.queryContractSmart(incTokenAddr, querySnip20Balance(poolAddr, `${process.env["viewingKey"]}`)),
            queryClient.queryContractSmart(poolAddr, queryDeadline())
        ];
        [rewardsBalance, incBalance, deadline] = await Promise.all(queries);

        db.collection("rewards_data").updateOne({ "pool_address": poolAddr },
            {
                $set: {
                    total_locked: incBalance.balance.amount,
                    pending_rewards: rewardsBalance.reward_pool_balance.balance,
                    deadline: deadline.end_height.height
                }
            });
    });
};

export default timerTrigger;
