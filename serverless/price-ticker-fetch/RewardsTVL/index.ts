import { AzureFunction, Context } from "@azure/functions";
import { MongoClient } from "mongodb";
import {CosmWasmClient, EnigmaUtils} from "secretjs";

interface RewardPoolData {
    pool_address: string;
    inc_symbol: string;
    inc_address: string;
    total_locked: string;
    pending_rewards: string;
    deadline: string;
}

interface QueryDeadline {
    end_height: {};
}

interface QueryRewardPool {
    reward_pool_balance: {};
}

interface QuerySnip20Balance {
    balance: {
        address: string;
        key: string;
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
        const addr = pool.pool_address;

    });

};

export default timerTrigger;
