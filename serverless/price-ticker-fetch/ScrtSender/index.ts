import { AzureFunction, Context } from "@azure/functions";
import { MongoClient } from "mongodb";
import Web3 from "web3";
import {Contract} from "web3-eth-contract/types";
import {SigningCosmWasmClient, Secp256k1Pen, BroadcastMode} from "secretjs";

const erc20ABI = [
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "bytes",
                "name": "recipient",
                "type": "bytes"
            }
        ],
        "name": "Swap",
        "type": "event" as "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "bytes",
                "name": "recipient",
                "type": "bytes"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "tokenAddress",
                "type": "address"
            }
        ],
        "name": "SwapToken",
        "type": "event" as "event"
    }
];

// we don't really send anything encrypted, so this doesn't matter
const seed = Uint8Array.from([
    45, 252, 210, 141,  45, 110, 235, 100,
    69, 230, 209,  79, 247,  18,   0,  12,
    103, 160, 163, 178,   5,  52, 131, 242,
    102, 148, 214, 132, 243, 222,  97,   4
]);

const faucet = {
    mnemonic: `${process.env["faucetMnemonic"]}`,
    address: `${process.env["faucetAddress"]}`
};

const pizzaAmount = `${process.env["pizzaAmount"]}`;


const sendScrt = async (address: string) => {
    const pen = await Secp256k1Pen.fromMnemonic(faucet.mnemonic);
    const client = new SigningCosmWasmClient(`${process.env["secretNodeURL"]}`, faucet.address, (signBytes) => pen.sign(signBytes),
        seed,
        {
            send: {
                amount: [{ amount: "80000", denom: "uscrt" }],
                gas: "80000",
            },
        },
        BroadcastMode.Block
    );
    await client.sendTokens(address, [{amount: pizzaAmount, denom: "uscrt"}]);
};

const w3 = new Web3(process.env["EthProvider"]);

const getAddressFromEvents = async (contract: Contract, name: string, fromBlock: number, toBlock: number): Promise<string[]> => {
    return (await contract.getPastEvents(name, {fromBlock: fromBlock, toBlock: toBlock})).map(
        evt => evt.returnValues.recipient
    );
};

const getNewSwapAddresses = async (address: string, fromBlock: number, toBlock: number): Promise<string[]> => {

    const contract = new w3.eth.Contract(erc20ABI, address);

    const addresses = await getAddressFromEvents(contract, "Swap", fromBlock, toBlock);

    const allAddresses = addresses.concat(await getAddressFromEvents(contract, "SwapToken", fromBlock, toBlock));

    return allAddresses.map(addr => Buffer.from(addr.substring(2), "hex").toString());
};


const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {

    const client: MongoClient = await MongoClient.connect(`${process.env["mongodbUrl"]}`,
        { useUnifiedTopology: true, useNewUrlParser: true }).catch(
        (err: any) => {
            context.log(err);
            throw new Error("Failed to connect to database");
        }
    );
    const db = await client.db(`${process.env["mongodbName"]}`);

    const fromBlock: number = await db.collection("swap_tracker_object").findOne({src: "scrt_sender"}).then(
        value => value.nonce
    ).catch(
        (err: any) => {
            context.log(err);
            throw new Error("Failed to get start value from swap tracker");
        }
    );

    const currentBlock = await w3.eth.getBlockNumber();

    context.log(fromBlock);

    if (currentBlock < fromBlock) {
        throw new Error("Failed to get start value from swap tracker");
    }

    const addresses = await getNewSwapAddresses(`${process.env["MultisigAddress"]}`, fromBlock, currentBlock);

    context.log(`debug: addresses ${JSON.stringify(addresses)}`);

    for (const addr of addresses) {
        const found = await db.collection("scrt_tip_addresses").findOne({address: addr});
        context.log(`debug: found new address ${found}`);
        if (!found) {
            context.log(`debug: sending to ${addr}`);
            await sendScrt(addr);

            await db.collection("scrt_tip_addresses").save({address: addr});
            context.log(`debug: sent to ${addr} and saved in db successfully`);
        } else {
            context.log(`debug: already sent to address ${addr}`);
        }
    }

    await db.collection("swap_tracker_object").updateOne({src: "scrt_sender"}, { $set: { nonce: currentBlock }});

    const timeStamp = new Date().toISOString();
    context.log("JavaScript timer trigger function ran!", timeStamp);
};

export default timerTrigger;
