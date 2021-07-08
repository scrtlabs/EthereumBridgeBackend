import { AzureFunction, Context } from "@azure/functions";
import { MongoClient } from "mongodb";
import fetch from "node-fetch";
import {priceFromPoolInScrt} from "./utils";
import {BroadcastMode, CosmWasmClient} from "secretjs";

const sefiAddress = process.env["sefiAddress"] || "secret12q2c5s5we5zn9pq43l0rlsygtql6646my0sqfm";
const sefiPairAddress = process.env["sefiPairAddress"] || "secret1l56ke78aj9jxr4wu64h4rm20cnqxevzpf6tmfc";
const binanceUrl = "https://api.binance.com/api/v3/ticker/price?";
const coinGeckoUrl = "https://api.coingecko.com/api/v3/simple/price?";
const uiDbUri = process.env["mongodbUrlUi"];
const uiDbName = process.env["mongodbNameUi"];
const bridgeDbName = process.env["mongodbNameBridge"];
const bridgeDbUri = process.env["mongodbUrlBridge"];

// this isn't actually secret
const seed = Uint8Array.from([
    45, 252, 210, 141,  45, 110, 235, 100,
    69, 230, 209,  79, 247,  18,   0,  12,
    103, 160, 163, 178,   5,  52, 131, 242,
    102, 148, 214, 132, 243, 222,  97,   4
]);


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

interface PriceOracle {
    getPrices: (symbols: string[]) => Promise<PriceResult[]>;
}

const priceRelativeToUSD = (priceBTC: string, priceRelative: string): string => {
    return String(parseFloat(priceBTC) * parseFloat(priceRelative));
};

class ConstantPriceOracle implements PriceOracle {

    // add symbols and values here to add constant price oracles (for tokens that aren't supported by other oracles yet)
    priceMap = {
        // SIENNA: "6.0",
        // WSIENNA: "6.0"
    }

    async getPrices(symbols: string[]): Promise<PriceResult[]> {
        const resp = symbols.map((symbol): PriceResult => {

            const price = this.priceMap[symbol];
            if (!price) {
                return {
                    symbol,
                    price: undefined
                };
            }
            return {symbol, price };
        });
        return Promise.resolve(resp);
    };
}

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
        "SSCRT": "secret",
        "ETH": "ethereum",
        "bETH": "ethereum",
        "OCEAN": "ocean-protocol",
        "USDT": "tether",
        "YFI": "yearn-finance",
        "LINK": "chainlink",
        "DAI": "dai",
        "WBTC": "wrapped-bitcoin",
        "UNI": "uniswap",
        "AAVE": "aave",
        "COMP": "compound-governance-token",
        "SNX": "havven",
        "TUSD": "true-usd",
        "BAND": "band-protocol",
        "BAC": "basis-cash",
        "MKR": "maker",
        "KNC": "kyber-network",
        "DPI": "defipulse-index",
        "RSR": "reserve-rights-token",
        "REN": "republic-protocol",
        "RENBTC": "renbtc",
        "USDC": "usd-coin",
        "SUSHI": "sushi",
        "RUNE": "thorchain-erc20",
        "TORN": "tornado-cash",
        "BAT": "basic-attention-token",
        "ZRX": "0x",
        "ENJ": "enjincoin",
        "MANA": "decentraland",
        "YFL": "yflink",
        "ALPHA": "alpha-finance",
        "MATIC": "matic-network",
        "BUSD": "binance-usd",
        "BNB": "binancecoin",
        "ADA": "cardano",
        "XRP": "ripple",
        "DOGE": "dogecoin",
        "DOT": "polkadot",
        "BCH": "bitcoin-cash",
        "LTC": "litecoin",
        "TRX": "tron",
        "CAKE": "pancakeswap-token",
        "BAKE": "bakerytoken",
        "XVS": "venus",
        "LINA": "linear",
        "FINE": "refinable",
        "BUNNY": "pancake-bunny",
        "SIENNA": "sienna-erc20",
        "WSIENNA": "sienna-erc20"
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
                        price: String(resultRelative)
                    };
                } catch {
                    throw new Error(`Failed to parse response for token: ${symbol}. id: ${coinGeckoID}, response: ${JSON.stringify(asJson)}`);
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

// disabling new BinancePriceOracle till we figure out the DAI stuff
const oracles: PriceOracle[] = [new CoinGeckoOracle, new ConstantPriceOracle, new SecretSwapOracle];

const uniLPPrefix = "UNILP";

const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {

    const client: MongoClient = await MongoClient.connect(uiDbUri,
        { useUnifiedTopology: true, useNewUrlParser: true }).catch(
        (err: any) => {
            context.log(err);
            throw new Error(`Failed to connect to database ${uiDbUri}`);
        }
    );
    const db = await client.db(uiDbName);

    const bridgeClient: MongoClient = await MongoClient.connect(bridgeDbUri,
        { useUnifiedTopology: true, useNewUrlParser: true }).catch(
        (err: any) => {
            context.log(err);
            throw new Error(`Failed to connect to database ${bridgeDbUri}`);
        }
    );
    const bridgeDb = await bridgeClient.db(bridgeDbName);

    const tokens = await db.collection("token_pairing").find({}).limit(100).toArray().catch(
        (err: any) => {
            context.log(err);
            throw new Error("Failed to get tokens from collection");
        }
    );
    //context.log(tokens);

    let symbols;

    // the split '(' handles the (BSC) tokens
    try {
         symbols = tokens
             .map(t => t.display_props.symbol.split("(")[0])
             .filter(t => !t.startsWith(uniLPPrefix))
             .filter(t => !t.startsWith("SEFI"));
    } catch (e) {
        context.log(e);
        throw new Error("Failed to get symbol for token");
    }

    const prices: PriceResult[][] = await Promise.all(oracles.map(
        async o => (await o.getPrices(symbols)).filter(p => !isNaN(Number(p.price)))
    ));

    const averagePrices: PriceResult[] = [];
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
        //context.log(`${symbol} - ${total}:${length}`);
        averagePrices.push({
            symbol,
            price: (total / length).toFixed(4),
        });

    }


    //context.log(average_prices);

    await Promise.all(
        averagePrices.map(async p => {
            await db.collection("token_pairing").updateOne({"display_props.symbol": new RegExp(p.symbol, "i")}, { $set: { price: p.price }});
            await bridgeDb.collection("token_price").updateOne({"symbol": new RegExp(p.symbol, "i")}, { $set: { price: p.price }});
        })).catch(
        (err) => {
            context.log(err);
            throw new Error("Failed to fetch price");
        });
    await client.close();

    // const timeStamp = new Date().toISOString();
    // context.log("JavaScript timer trigger function ran!", timeStamp);
};

export default timerTrigger;
