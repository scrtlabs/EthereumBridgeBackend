import {Connection, ConnectOptions, createConnection, set, connect} from "mongoose";
import config from "../util/config";
import Logger from "../util/logger";

require("mongoose").Promise = Promise;

export default class SwapConnDB {
    static connInst: SwapConnDB = null;

    conn: Connection;
    options: ConnectOptions;

    constructor () {
        this.options = config.dataSources.dbOptions;
        this.options.dbName = config.dataSources.secretswap.dbName;
        this.options.user = config.dataSources.dbInfo.dbUser;
        this.options.pass = config.dataSources.dbInfo.dbPass;
        Logger.info(`connecting to db: ${config.dataSources.dbInfo.uri}`);

        this.conn = createConnection(config.dataSources.dbInfo.uri, this.options);
    }

    static getConn () {
        if (SwapConnDB.connInst) {
            return SwapConnDB.connInst.conn;
        } else {
            SwapConnDB.connInst = new SwapConnDB();
            return SwapConnDB.connInst.conn;
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
