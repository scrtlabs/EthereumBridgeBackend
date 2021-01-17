import { AzureFunction, Context } from "@azure/functions";
import { MongoClient } from "mongodb";
import fetch from "node-fetch";

const binanceUrl = "https://api.binance.com/api/v3/ticker/price?";
const coinGeckoUrl = "https://api.coingecko.com/api/v3/simple/price?";

interface PriceOracle {
    getPrices: (symbols: string[]) => Promise<PriceResult[]>;
}

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
                    return {symbol: "USDT", price: "1.000"};
                }

                if (symbol === "BTC") {
                    return {symbol: "BTC", price: priceBTC.price};
                }

                const priceRelative = await fetch(binanceUrl + new URLSearchParams({
                    symbol: `${symbol}BTC`,
                })).catch(
                    (err) => {
                        //console.log(`symbol doesn't exist: ${err}`);
                        return undefined;
                    }
                );

                const resultRelative = await priceRelative.json();

                return {
                    symbol: symbol,
                    price: priceRelativeToUSD(priceBTC.price, resultRelative.price)
                };
            })).catch(
            (err) => {
                throw new Error(`Binance oracle failed to fetch price: ${err}`);
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
                if (!coinGeckoID) {
                    return {
                        symbol,
                        price: undefined
                    };
                }

                const priceRelative = await fetch(coinGeckoUrl + new URLSearchParams({
                    ids: coinGeckoID,
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    vs_currencies: "USD"
                })).catch(
                    (_) => {
                        return {
                            symbol,
                            price: undefined
                        };
                    }
                );

                const asJson = await priceRelative.json();
                try {
                    const resultRelative = asJson[coinGeckoID].usd;
                    return {
                        symbol: symbol,
                        price: resultRelative
                    };
                } catch {
                    throw new Error(`Failed to parse response for token: ${symbol}. id: ${coinGeckoID}, response: ${asJson}`);
                }

            })).catch(
            (err) => {
                throw new Error(`Coingecko oracle failed to fetch price: ${err}`);
            });
    }
}


interface PriceResult {
    price: string;
    symbol: string;
}

const oracles: PriceOracle[] = [new BinancePriceOracle, new CoinGeckoOracle];

const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {

    const client: MongoClient = await MongoClient.connect(`mongodb+srv://leader:6FXQ3gHXQQAkbpmI@cluster0.dka2m.mongodb.net/reuven-bridge-test-1?retryWrites=true&w=majority`,
        { useUnifiedTopology: true }).catch(
        (err: any) => {
            context.log(err);
            throw new Error("Failed to connect to database");
        }
    );
    const db = await client.db(`reuven-bridge-test-1`);

    const tokens = await db.collection("token_pairing").find({}).limit(31).toArray().catch(
        (err: any) => {
            context.log(err);
            throw new Error("Failed to get tokens from collection");
        }
    );
    //context.log(tokens);

    let symbols;

    try {
         symbols = tokens.map(t => t.display_props.symbol);
    } catch (e) {
        context.log(e);
        throw new Error("Failed to get symbol for token");
    }

    let prices: PriceResult[][] = await Promise.all(oracles.map(
        async o => (await o.getPrices(symbols)).filter(p => !isNaN(Number(p.price)))
    ));

    let average_prices: PriceResult[] = [];
    //context.log(prices);

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
        average_prices.push({
            symbol,
            price: (total / length).toFixed(4),
        });

    }


    //context.log(average_prices);

    await Promise.all(
        average_prices.map(async p => {
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
