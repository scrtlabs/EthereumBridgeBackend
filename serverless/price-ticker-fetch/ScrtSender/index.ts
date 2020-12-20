import { AzureFunction, Context } from "@azure/functions";
import { MongoClient } from "mongodb";
import Web3 from "web3";
import {Contract} from "web3-eth-contract/types";
import secretjs from "secretjs";

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

const faucet = {
    mnemonic: `${process.env["faucetMnemonic"]}`,
    address: `${process.env["faucetAddress"]}`
};

const pizzaAmount = `${process.env["pizzaAmount"]}`;

const sendScrt = async (address: string) => {
    const pen = await secretjs.Secp256k1Pen.fromMnemonic(faucet.mnemonic);
    const client = new secretjs.SigningCosmWasmClient(`${process.env["secretNodeURL"]}`, faucet.address, (signBytes) => pen.sign(signBytes));

    const ret = await client.sendTokens(address, [{amount: pizzaAmount, denom: "uscrt"}]);

    return ret.rawLog;
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

    const client: MongoClient = await MongoClient.connect(`${process.env["mongodbUrl"]}`).catch(
        (err: any) => {
            context.log(err);
            throw new Error("Failed to connect to database");
        }
    );
    const db = await client.db(`${process.env["mongodbName"]}`);

    const fromBlock: number = await db.collection("swap_tracker_object").findOne({src: "scrt_sender"}).catch(
        (err: any) => {
            context.log(err);
            throw new Error("Failed to get start value from swap tracker");
        }
    ).then(
        value => value.nonce
    );

    const currentBlock = await w3.eth.getBlockNumber();

    context.log(fromBlock);

    if (currentBlock < fromBlock) {
        throw new Error("Failed to get start value from swap tracker");
    }

    const addresses = await getNewSwapAddresses(`${process.env["MultisigAddress"]}`, fromBlock, currentBlock);

    context.log(`debug: addresses ${JSON.stringify(addresses)}`);

    addresses.map(
        async (addr) => {
            const found = await db.collection("scrt_tip_addresses").findOne({address: addr});
            context.log(`debug: found ${found}`);
            if (!found) {
                context.log(`debug: sending to ${addr}`);
                const log = await sendScrt(addr);
                context.log(`debug: sent to ${addr}, log: ${log}`);
                await db.collection("scrt_tip_addresses").save({address: addr});
            } else {
                context.log(`debug: already sent to address ${addr}`);
            }
        }
    );

    await db.collection("swap_tracker_object").updateOne({src: "scrt_sender"}, { $set: { nonce: currentBlock }});

    const timeStamp = new Date().toISOString();
    context.log("JavaScript timer trigger function ran!", timeStamp);
};

export default timerTrigger;
