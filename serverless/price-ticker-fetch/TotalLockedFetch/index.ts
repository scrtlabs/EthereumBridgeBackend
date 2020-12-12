import { AzureFunction, Context } from "@azure/functions"
import { MongoClient } from "mongodb";
import Web3 from "web3";

const erc20ABI = [
    {
        constant: true,
        inputs: [],
        name: "name",
        outputs: [
            {
                name: "",
                type: "string"
            }
        ],
        payable: false,
        type: "function" as "function"
    },
    {
        constant: true,
        inputs: [],
        name: "decimals",
        outputs: [
            {
                name: "",
                type: "uint8"
            }
        ],
        payable: false,
        type: "function" as "function"
    },
    {
        constant: true,
        inputs: [
            {
                name: "_owner",
                type: "address"
            }
        ],
        name: "balanceOf",
        outputs: [
            {
                name: "balance",
                type: "uint256"
            }
        ],
        payable: false,
        type: "function" as "function"
    },
    {
        constant: true,
        inputs: [],
        name: "symbol",
        outputs: [
            {
                name: "",
                type: "string"
            }
        ],
        payable: false,
        type: "function" as "function"
    }
];

const w3 = new Web3(process.env['EthProvider']);

const getEthBalance = async (address: string): Promise<string> => {
    return await w3.eth.getBalance(address);
};

const getErcBalance = async (address: string, token: string): Promise<string> => {

    const contract = new w3.eth.Contract(erc20ABI, token);

    const result = await contract.methods.balanceOf(address).call();

    return w3.utils.toBN(result).toString();
};

interface LockedResult {
    balance: string,
    balanceNormal: number,
    balanceUSD: number,
    address: string
}

const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {

    let client: MongoClient = await MongoClient.connect(`${process.env["mongodbUrl"]}`).catch(
        (err: any) => {
            context.log(err);
            throw new Error("Failed to connect to database");
        }
    );
    const db = await client.db(`${process.env["mongodbName"]}`)

    let tokens = await db.collection("token_pairing").find({}).limit(20).toArray().catch(
        (err: any) => {
            context.log(err);
            throw new Error("Failed to get tokens from collection");
        }
    );
    context.log(tokens)

    let balances: LockedResult[] = await Promise.all<LockedResult>(
        tokens.map(async (token): Promise<LockedResult> => {

            if (token.src_address === "native") {
                const balance = await getEthBalance(process.env['MultisigAddress']);
                const balanceNormal = Number(balance) / Math.pow(10, Number(token.decimals))
                const balanceUSD = balanceNormal * Number(token.price);
                return {address: token.src_address, balance, balanceNormal, balanceUSD}
            }

            const balance = await getErcBalance(process.env['MultisigAddress'], token.src_address);
            const balanceNormal = Number(balance) / Math.pow(10, Number(token.decimals))
            const balanceUSD = balanceNormal * Number(token.price);

            return {address: token.src_address, balance, balanceNormal, balanceUSD}
    })).catch(
        (err) => {
            context.log(err);
            throw new Error("Failed to fetch balance")
    });

    context.log(balances);

    await Promise.all(
        balances.map(async b => {
            await db.collection("token_pairing").updateOne(
                {"src_address": b.address},
                { $set:
                        { totalLocked: b.balance,
                          totalLockedNormal: String(b.balanceNormal),
                          totalLockedUSD: String(b.balanceUSD)
                        }
                });
        })).catch(
        (err) => {
            context.log(err);
            throw new Error("Failed to fetch price")
        });

    let timeStamp = new Date().toISOString();
    context.log('JavaScript timer trigger function ran!', timeStamp);
};

export default timerTrigger;
