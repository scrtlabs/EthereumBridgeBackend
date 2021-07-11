import {Connection, ConnectOptions, createConnection, set, connect} from "mongoose";
import * as mongoose from "mongoose";
import config from "../util/config";
import Logger from "../util/logger";

require("mongoose").Promise = Promise;

export default class BridgeConnDB {
    static connInst: BridgeConnDB = null;

    conn: Connection;
    options: ConnectOptions;

    constructor () {
        this.options = config.dataSources.dbOptions;
        this.options.dbName = config.dataSources.bridge.dbName;
        this.options.user = config.dataSources.dbInfo.dbUser;
        this.options.pass = config.dataSources.dbInfo.dbPass;
        Logger.info(`connecting to db: ${config.dataSources.dbInfo.uri}`);
        this.conn = createConnection(config.dataSources.dbInfo.uri, this.options);
    }

    static getConn () {
        if (BridgeConnDB.connInst) {
            return BridgeConnDB.connInst.conn;
        } else {
            BridgeConnDB.connInst = new BridgeConnDB();
            return BridgeConnDB.connInst.conn;
        }
    }

    async initDB () {
        return new Promise((resolve, reject) => {
            if (!this.conn) {
                this.conn = createConnection(config.dataSources.dbInfo.uri, this.options);
            }

            if (config.env === "dev") {
                set("debug", true);
            }

            this.conn.on("disconnected", () => {
                connect(config.dataSources.dbInfo.uri);
            });

            this.conn.on("error", (err) => {
                reject(err);
            });

            this.conn.on("open", () => {
                resolve(this.conn);
            });

            this.conn.once("open", () => {
                Logger.info(`Connected to MongoDB ${config.dataSources.dbInfo.uri}`);
            });
        });
    }
}
