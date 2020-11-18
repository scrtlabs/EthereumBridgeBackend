import express from "express";
import compression from "compression";  // compresses requests
import session from "express-session";
import bodyParser from "body-parser";
import lusca from "lusca";
import mongo from "connect-mongo";
//import multer from "multer";
import mongoose from "mongoose";

import cors from 'cors';

import bluebird from "bluebird";
import { SESSION_SECRET } from "./util/secrets";
import logger from "./util/logger";
const MongoStore = mongo(session);

import * as swapController from "./controllers/swaps";
import * as tokenController from "./controllers/tokens";
import * as opController from "./controllers/operations";

import Cache from './util/cache';
import config from "./util/config";

// import Agenda from "agenda";

// Create Express server
const app = express();

// Connect to MongoDB
mongoose.Promise = bluebird;

const mongoUrl = config.db;
mongoose.connect(mongoUrl, {
    dbName: config.dbName,
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    user: config.dbUser,
    pass: config.dbPass} ).then(
    () => { /** ready to use. The `mongoose.connect()` promise resolves to undefined. */ },
).catch(err => {
    logger.error("MongoDB connection error. Please make sure MongoDB is running. " + err);
    // process.exit();
});

// todo remove this eventually
app.use(cors())

// Express configuration
app.set("port", config.port || 8000);

app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: SESSION_SECRET,
    store: new MongoStore({
        mongooseConnection: mongoose.connection,
        autoReconnect: true
    })
}));

// const agenda = new Agenda({mongo: mongoose.connection.useDb('agenda')});
// let connectionEstablished = false;
// // When the connection is established, set the flag
// agenda.on('ready', function() {
//     connectionEstablished = true;
//     logger.info('Agenda connected')
// });
//
// // It's better practice to have this function defined on your agenda object
// // When the server initializes rather than having initializing it only if a POST
// // request occurrs.
// agenda.define('test', function () {
//     console.log('Test');
// });

app.use(lusca.xframe("SAMEORIGIN"));
app.use(lusca.xssProtection(true));

app.get("/tokens/", tokenController.getTokenPairings);
app.get("/tokens/:token", tokenController.getToken);

app.get("/swaps/", swapController.getAllSwaps);
app.get("/swaps/:swap", swapController.getSwapInfo);

app.post("/operations/", opController.newOperation);
app.get("/operations/:id", opController.getOperation);

export default app;
