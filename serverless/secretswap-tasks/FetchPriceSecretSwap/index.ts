import {AzureFunction, Context} from "@azure/functions";
import {MongoClient} from "mongodb";
import {priceFromPoolInScrt} from "./utils";
import {BroadcastMode, CosmWasmClient, Secp256k1Pen, SigningCosmWasmClient} from "secretjs";
import fetch from "node-fetch";

const coinGeckoUrl = "https://api.coingecko.com/api/v3/simple/price?";

interface PriceOracle {
    getPrices: (symbols: string[], context?: any) => Promise<PriceResult[]>;
}

const seed = Uint8Array.from([
    45, 252, 210, 141,  45, 110, 235, 100,
    69, 230, 209,  79, 247,  18,   0,  12,
    103, 160, 163, 178,   5,  52, 131, 242,
    102, 148, 214, 132, 243, 222,  97,   4
]);


const sefiAddress = `${process.env["sefiAddress"] || "secret12q2c5s5we5zn9pq43l0rlsygtql6646my0sqfm"}`;
const sefiPairAddress = `${process.env["sefiPairAddress"] || "secret1l56ke78aj9jxr4wu64h4rm20cnqxevzpf6tmfc"}`;

const getSecretJs = (): CosmWasmClient => {
    return new CosmWasmClient(`${process.env["secretNodeURL"]}`,
        seed,
        BroadcastMode.Block
    );
};

const getScrtPrice = async (): Promise<number> => {

    const priceRelative = await fetch(coinGeckoUrl + new URLSearchParams({
        ids: "secret",
        // eslint-disable-next-line @typescript-eslint/camelcase
        vs_currencies: "USD"
    })).catch(
        (_) => {
            throw new Error("Failed to parse response for secret");
        }
    );

    const asJson = await priceRelative.json();
    try {
        const resultRelative = asJson["secret"].usd;
        return Number(resultRelative);
    } catch {
        throw new Error(`Failed to parse response for secret. response: ${JSON.stringify(asJson)}`);
    }
};

class SecretSwapOracle implements PriceOracle {

    symbolMap = {
        "SEFI": {address: sefiAddress, pair: sefiPairAddress},
    }

    symbolToID = symbol => {
        return this.symbolMap[symbol.toUpperCase()];
    }

    async getPrices(symbols: string[], context?: any): Promise<PriceResult[]> {

        const secretjs = getSecretJs();
        let priceScrt;
        try {
            priceScrt = await getScrtPrice();
            if (context) {
                context.log(`scrt price: ${priceScrt}`);
            }
        } catch (e) {
            throw new Error("failed to get scrt price from coingecko");
        }

        return Promise.all<PriceResult>(
            symbols.map(async (symbol): Promise<PriceResult> => {

                const swapAddress = this.symbolToID(symbol);
                context.log(`Got swap address: ${JSON.stringify(swapAddress)}`);
                if (!swapAddress) {
                    return {
                        symbol,
                        price: undefined
                    };
                }

                const priceRelative = await priceFromPoolInScrt(secretjs, swapAddress.address, swapAddress.pair, context);
                context.log(`Got relative price: ${JSON.stringify(priceRelative)}`);
                return {
                    symbol: symbol,
                    price: String(priceScrt * priceRelative)
                };

            })).catch(
            (err) => {
                throw new Error(`SecretSwap oracle failed to fetch price: ${err}`);
            });
    }
}


interface PriceResult {
    price: string;
    symbol: string;
}

// disabling new BinancePriceOracle till we figure out the DAI stuff
const oracles: PriceOracle[] = [new SecretSwapOracle];


const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {

    const client: MongoClient = await MongoClient.connect(`${process.env["mongodbUrl"]}`,
        { useUnifiedTopology: true, useNewUrlParser: true }).catch(
        (err: any) => {
            context.log(err);
            throw new Error("Failed to connect to database");
        }
    );
    const db = await client.db(`${process.env["mongodbName"]}`);

    const tokens = await db.collection("token_pairing").find({}).limit(100).toArray().catch(
        (err: any) => {
            context.log(err);
            throw new Error("Failed to get tokens from collection");
        }
    );
    context.log(tokens);

    const sefiTokens = tokens.filter(t => t?.display_props?.symbol === "SEFI");

    context.log(sefiTokens);

    let symbols;
    //
    try {
         symbols = sefiTokens
             .map(t => t.display_props.symbol);
             //.filter(t => t.toLowerCase().startsWith("sefi"));
    } catch (e) {
        context.log(e);
        throw new Error("Failed to get symbol for token");
    }
    context.log(`sefi token symbol: ${symbols}`);
    const prices: PriceResult[][] = await Promise.all(oracles.map(
        async o => (await o.getPrices(symbols, context)).filter(p => !isNaN(Number(p.price)))
    ));

    const averagePrices: PriceResult[] = [];
    context.log(prices);

    for (const symbol of symbols) {

        let total = 0;
        let length = 0;
        prices.forEach((priceOracleResponse: PriceResult[]) => {

            priceOracleResponse.forEach((price: PriceResult) => {
                if (symbol === price.symbol){
                    total += parseFloat(price.price);
                    length++;
                }
            });
        });
        context.log(`${symbol} - ${total}:${length}`);
        averagePrices.push({
            symbol,
            price: (total / length).toFixed(4),
        });

    }

    context.log(averagePrices);

    await Promise.all(
        averagePrices.map(async p => {
            if (!isNaN(Number(p.price))) {
                await db.collection("token_pairing").updateOne({"display_props.symbol": p.symbol}, { $set: { price: p.price }});
            }
        })).catch(
        (err) => {
            context.log(err);
            throw new Error("Failed to fetch price");
        });
    await client.close();

    const timeStamp = new Date().toISOString();
    context.log("JavaScript timer trigger function ran!", timeStamp);
};

export default timerTrigger;
