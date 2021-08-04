import { AzureFunction, Context } from "@azure/functions";
import { MongoClient } from "mongodb";
import Web3 from "web3";
import fetch from "node-fetch";

const supportedNetworks = ["ethereum", "binancesmartchain"];

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
    },
    {
        constant: true,
        inputs: [],
        name: "totalSupply",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256"
            }
        ],
        payable: false,
        type: "function" as "function"
    }
];

const w3 = new Web3(process.env["EthProvider"]);

const getEthBalance = async (address: string): Promise<string> => {
    return await w3.eth.getBalance(address);
};

const getErcSupply = async (token: string): Promise<string> => {
    const contract = new w3.eth.Contract(erc20ABI, token);

    const result = await contract.methods.totalSupply().call();

    return w3.utils.toBN(result).toString();
};

const getErcBalance = async (address: string, token: string): Promise<string> => {

    const contract = new w3.eth.Contract(erc20ABI, token);

    const result = await contract.methods.balanceOf(address).call();

    return w3.utils.toBN(result).toString();
};


const uniABI = [
    {
        constant: true,
        inputs: [],
        name: "price0CumulativeLast",
        outputs: [{ name: "", type: "uint" }],
        payable: false,
        type: "function" as "function"
    },
    {
        constant: true,
        inputs: [],
        name: "price1CumulativeLast",
        outputs: [{ name: "", type: "uint256" }],
        payable: false,
        type: "function" as "function"
    },
    {
        constant: true,
        inputs: [],
        name: "totalSupply",
        outputs: [{ name: "", type: "uint256" }],
        payable: false,
        type: "function" as "function"
    },
    {
        constant: true,
        inputs: [],
        name: "getReserves",
        outputs: [
            { name: "reserve0", type: "uint112" },
            { name: "reserve1", type: "uint112" },
            { name: "blockTimestampLast", type: "uint32" }],
        payable: false,
        type: "function" as "function"
    }
];

const uniLPPrefix = "UNILP";
const coinGeckoUrl = "https://api.coingecko.com/api/v3/simple/price?";

const ethPrice = async (): Promise<string> => {
    const price = await fetch(coinGeckoUrl + new URLSearchParams({
        ids: "ethereum",
        // eslint-disable-next-line @typescript-eslint/camelcase
        vs_currencies: "USD"
    }));
    return (await price.json())["ethereum"].usd;
};

// this only works for ETH pairs... todo: generalize it when we want to reward other pools
const getUniPrice = async (address: string) => {

    const contract = new w3.eth.Contract(uniABI, address);

    const totalSupply = await contract.methods.totalSupply().call();

    const priceETH = Number(await ethPrice());
    const res = await contract.methods.getReserves().call();

    const price = res["1"] * priceETH * 2 / totalSupply;

    //console.log(`${JSON.stringify(res)}, ${totalSupply}`)

    return price.toString();
};


interface LockedResult {
    balance: string;
    balanceNormal: number;
    balanceUSD: number;
    address: string;
}

const updateDbPrice = async (db, address, price) => {
    await db.collection("token_pairing").updateOne(
        {"src_address": address},
        { $set: { price: price } }
        ).catch(
            (err) => {
                throw new Error(`Failed to update price: ${err}`);
            });
};

const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {

    const client: MongoClient = await MongoClient.connect(`${process.env["mongodbUrl"]}`,
        { useUnifiedTopology: true, useNewUrlParser: true }).catch(
        async (err: any) => {
            context.log(err);
            await client.close();
            throw new Error("Failed to connect to database");
        }
    );
    const db = await client.db(`${process.env["mongodbName"]}`);

    const tokens = await db.collection("token_pairing").find({}).limit(100).toArray().catch(
        async (err: any) => {
            context.log(err);
            await client.close();
            throw new Error("Failed to get tokens from collection");
        }
    );
    //context.log(tokens);

    const balances: LockedResult[] = await Promise.all<LockedResult>(
        tokens
            .filter((token) => supportedNetworks.includes(token.src_network.trim().toLowerCase()))
            .map(async (token): Promise<LockedResult> => {

            let balance;
            if (token.src_address === "native") {
                balance = await getEthBalance(process.env["MultisigAddress"]);
            }
            else if (token.src_coin === "WSCRT" || token.src_coin === "SEFI" || token.src_coin === "WSIENNA") {
                balance = await getErcSupply(token.src_address);
                //context.log(`total supply for ${token.src_coin}: ${balance}`);
            } else if (token.display_props.symbol.startsWith(uniLPPrefix)) {
                // uni price updates from here
                balance = await getErcBalance(process.env["MultisigAddress"], token.src_address);
                token.price = await getUniPrice(token.src_address);
                await updateDbPrice(db, token.src_address, token.price);
            }

            else {
                //context.log(`updating supply for  ${process.env["MultisigAddress"]}: ${token.src_address}`);
                balance = await getErcBalance(process.env["MultisigAddress"], token.src_address);
            }

            const balanceNormal = Number(balance) / Math.pow(10, Number(token.decimals));
            const balanceUSD = balanceNormal === 0 ? 0 : balanceNormal * Number(token.price);

            return {address: token.src_address, balance, balanceNormal, balanceUSD};
    })).catch(
        async (err) => {
            context.log(err);
            await client.close();
            throw new Error("Failed to fetch balance");
    });

    //context.log(balances);

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
        async (err) => {
            context.log(err);
            await client.close();
            throw new Error("Failed to fetch price");
        });

    await client.close();
    const timeStamp = new Date().toISOString();
    context.log("JavaScript timer trigger function ran!", timeStamp);
};

export default timerTrigger;
