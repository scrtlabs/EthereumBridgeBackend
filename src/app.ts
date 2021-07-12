import express from "express";
import compression from "compression"; // compresses requests
import bodyParser from "body-parser";
import lusca from "lusca";
import mongoose from "mongoose";

import cors from "cors";

import bluebird from "bluebird";

import * as swapController from "./controllers/swaps";
import * as tokenController from "./controllers/pairings";
import * as opController from "./controllers/operations";
import * as rewardsController from "./controllers/rewards";
// import * as secretSwapPairsController from "./controllers/secretswap_pairs";
// import * as secretSwapPoolsController from "./controllers/secretswap_pools";
import * as signerHealthController from "./controllers/signer_health";
// import * as claimsController from "./controllers/claims";
// import * as cashbackController from "./controllers/cashback_stats";
import config from "./util/config";

// Create Express server
const app = express();

mongoose.Promise = bluebird;

app.use(
  cors({
    origin: config.appUrl,
  })
);

// Express configuration
app.set("port", config.port || 8000);

app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(lusca.xframe("SAMEORIGIN"));
app.use(lusca.xssProtection(true));

app.get("/tokens/", tokenController.getTokenPairings);
app.get("/tokens/:token", tokenController.getToken);

app.get("/swaps/", swapController.getAllSwaps);
app.get("/swaps/:swap", swapController.getSwapInfo);

app.post("/operations/", opController.newOperation);
app.post("/operations/:operation", opController.updateOperation);
app.get("/operations/:operation", opController.getOperation);

app.get("/rewards/", rewardsController.getRewardPools);
app.get("/rewards/:pool", rewardsController.getPool);

app.get("/signer_health/", signerHealthController.getSignerHealth);

export default app;
