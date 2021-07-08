# TimerTrigger - JavaScript

The `TimerTrigger` makes it incredibly easy to have your functions executed on a schedule. This sample demonstrates a simple use case of calling your function every 5 minutes.

## How it works

For a `TimerTrigger` to work, you provide a schedule in the form of a [cron expression](https://en.wikipedia.org/wiki/Cron#CRON_expression)(See the link for full details). A cron expression is a string with 6 separate expressions which represent a given schedule via patterns. The pattern we use to represent every 5 minutes is `0 */5 * * * *`. This, in plain text, means: "When seconds is equal to 0, minutes is divisible by 5, for any hour, day of the month, month, day of the week, or year".

## Functions in this repo

### PriceApiFetch

Fetches the prices for every pair in USD (in USDT, but close enough).

Currently, has oracles for Coingecko, Binance, for setting a constant price, and from SecretSwap.

Only Coingecko is enabled right now for most coins - this seems to be working pretty well, albeit the coingecko API rate limits and isn't 100% reliable

SecretSwap is enabled for SEFI, as that is the main trading platform, and the ERC-20 volume isn't high enough to be reliable

### ScrtSender

Sends a small amount of SCRT to each new address that crosses the bridge (first time only).

On chains with low transaction fees (aka all except Ethereum) keep this disabled, otherwise people will just empty it out

### TotalLockedFetch

Fetches the total locked amount (# of tokens & USD amount) of each coin stored in the bridge. It does this by querying the EVM chain, and 
inspecting the token balance of the multisig contract and the current token price.

## Env vars required

* mongodbUrlUi (all) -
* mongodbNameUi (all) -
* mongodbUrlBridge (all) -
* mongodbNameBridge (all) -
* secretNodeURL (ScrtSender, FetchPriceSecretSwap) -
* secretjsSeed (ScrtSender) -
* pizzaAmount (ScrtSender) -
* MultisigAddress (TotalLockedFetch) -
* faucetMnemonic (ScrtSender) -
* faucetAddress (ScrtSender) -
* EthProvider (TotalLockedFetch) - 
* sefiPairAddress (FetchPriceSecretSwap) -
* sefiAddress (FetchPriceSecretSwap) -