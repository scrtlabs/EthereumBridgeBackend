import { AzureFunction, Context } from "@azure/functions"
import { MongoClient } from "mongodb";
import fetch from "node-fetch";

const binance_url = 'https://api.binance.com/api/v3/ticker/price?'

interface PriceResult {
    price: string,
    symbol: string
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

    let symbols;

    try {
         symbols = tokens.map(t => t.display_props.symbol);
    } catch (e) {
        context.log(e);
        throw new Error("Failed to get symbol for token")
    }

    let prices: PriceResult[] = await Promise.all<PriceResult>(
        symbols.map(async (symbol): Promise<PriceResult> => {

            if (symbol === "USDT") {
                return {symbol: "USDT", price: "1.000"}
            }

            let price = await fetch(binance_url + new URLSearchParams({
                symbol: `${symbol}USDT`,
            }));
            let result = await price.json();
            return {symbol: symbol, price: result.price};
    })).catch(
        (err) => {
            context.log(err);
            throw new Error("Failed to fetch price")
    });

    context.log(prices);

    await Promise.all(
        prices.map(async p => {
            await db.collection("token_pairing").updateOne({"display_props.symbol": p.symbol}, { $set: { price: p.price }});
        })).catch(
        (err) => {
            context.log(err);
            throw new Error("Failed to fetch price")
        });

    let timeStamp = new Date().toISOString();
    context.log('JavaScript timer trigger function ran!', timeStamp);
};

export default timerTrigger;
