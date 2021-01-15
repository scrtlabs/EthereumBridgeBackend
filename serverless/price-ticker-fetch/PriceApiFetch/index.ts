import { AzureFunction, Context } from "@azure/functions";
import { MongoClient } from "mongodb";
import fetch from "node-fetch";

const binanceUrl = "https://api.binance.com/api/v3/ticker/price?";
const coinGeckoUrl = "https://api.coingecko.com/api/v3/simple/price?";

interface PriceOracle {
    getPrices: (symbols: string[]) => Promise<PriceResult[]>;
}

const multiplier = 1e18;

const convertToUint128 = (price: string): string => {
    return BigInt(parseFloat(price) * multiplier).toString();
};

const priceRelativeToUSD = (priceBTC: string, priceRelative: string): string => {
    return String(parseFloat(priceBTC) * parseFloat(priceRelative));
};

class BinancePriceOracle implements PriceOracle {
    async getPrices(symbols: string[]): Promise<PriceResult[]> {

        const priceBTC = await(await fetch(binanceUrl + new URLSearchParams({
            symbol: "BTCUSDT",
        }))).json();

        return Promise.all<PriceResult>(
            symbols.map(async (symbol): Promise<PriceResult> => {

                if (symbol === "USDT") {
                    return {symbol: "USDT", price: convertToUint128("1.000")};
                }

                if (symbol === "BTC") {
                    return {symbol: "BTC", price: convertToUint128(priceBTC.price)};
                }

                const priceRelative = await fetch(binanceUrl + new URLSearchParams({
                    symbol: `${symbol}BTC`,
                })).catch(
                    (err) => {
                        console.log(`symbol doesn't exist: ${err}`);
                        return undefined;
                    }
                );

                const resultRelative = await priceRelative.json();

                return {
                    symbol: symbol,
                    price: convertToUint128(priceRelativeToUSD(priceBTC.price, resultRelative.price))
                };
            })).catch(
            (err) => {
                console.log(err);
                throw new Error("Failed to fetch price");
            });
    }
}

class CoinGeckoOracle implements PriceOracle {

    symbolMap = {
        "BTC": "bitcoin",
        "SCRT": "secret",
        "ETH": "ethereum",
        "OCEAN": "ocean-protocol",
        "USDT": "tether",
        "YFI": "yearn-finance",
        "LINK": "chainlink",
        "DAI": "dai",
        "WBTC": "wrapped-bitcoin",
        "UNI": "uniswap",
        "AAVE": "aave",
        "COMP": "compound",
        "SNX": "synthetix-network-token",
        "TUSD": "true-usd",
        "BAND": "band-protocol",
        "BAC": "basis-cash",
        "MKR": "maker",
        "KNC": "kyber-network"
    }

    symbolToID = symbol => {
        return this.symbolMap[symbol];
    }

    async getPrices(symbols: string[]): Promise<PriceResult[]> {

        return Promise.all<PriceResult>(
            symbols.map(async (symbol): Promise<PriceResult> => {

                const coinGeckoID = this.symbolToID(symbol);

                const priceRelative = await fetch(coinGeckoUrl + new URLSearchParams({
                    ids: coinGeckoID,
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    vs_currencies: "USD"
                })).catch(
                    (err) => {
                        console.log(`symbol doesn't exist: ${err}`);
                        return undefined;
                    }
                );

                const resultRelative = (await priceRelative.json())[coinGeckoID].usd;

                return {
                    symbol: symbol,
                    price: convertToUint128(resultRelative)
                };

            })).catch(
            (err) => {
                console.log(err);
                throw new Error("Failed to fetch price");
            });
    }
}


interface PriceResult {
    price: string;
    symbol: string;
}

const oracles: PriceOracle[] = [new BinancePriceOracle, new CoinGeckoOracle];

const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {

    const client: MongoClient = await MongoClient.connect(`${process.env["mongodbUrl"]}`).catch(
        (err: any) => {
            context.log(err);
            throw new Error("Failed to connect to database");
        }
    );
    const db = await client.db(`${process.env["mongodbName"]}`);

    const tokens = await db.collection("token_pairing").find({}).limit(20).toArray().catch(
        (err: any) => {
            context.log(err);
            throw new Error("Failed to get tokens from collection");
        }
    );
    context.log(tokens);

    let symbols;

    try {
         symbols = tokens.map(t => t.display_props.symbol);
    } catch (e) {
        context.log(e);
        throw new Error("Failed to get symbol for token");
    }

    let prices: PriceResult[][] = await Promise.all(oracles.map(
        o => o.getPrices(symbols)
    ));

    // const prices: PriceResult[] = await Promise.all<PriceResult>(
    //     symbols.map(async (symbol): Promise<PriceResult> => {
    //
    //         if (symbol === "USDT") {
    //             return {symbol: "USDT", price: "1.000"};
    //         }
    //
    //         if (symbol === "WBTC") {
    //             const price = await fetch(binanceUrl + new URLSearchParams({
    //                 symbol: "BTCUSDT",
    //             }));
    //             const result = await price.json();
    //             return {symbol: symbol, price: result.price};
    //         }
    //
    //         const price = await fetch(binanceUrl + new URLSearchParams({
    //             symbol: `${symbol}USDT`,
    //         }));
    //         const result = await price.json();
    //         return {symbol: symbol, price: result.price};
    // })).catch(
    //     (err) => {
    //         context.log(err);
    //         throw new Error("Failed to fetch price");
    // });

    context.log(prices);

    await Promise.all(
        prices.map(async p => {
            await db.collection("token_pairing").updateOne({"display_props.symbol": p.symbol}, { $set: { price: p.price }});
        })).catch(
        (err) => {
            context.log(err);
            throw new Error("Failed to fetch price");
        });

    const timeStamp = new Date().toISOString();
    context.log("JavaScript timer trigger function ran!", timeStamp);
};

export default timerTrigger;
