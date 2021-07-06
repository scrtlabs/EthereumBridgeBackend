import {Connection, ConnectOptions} from 'mongoose';
import * as mongoose from 'mongoose';
import config from '../util/config';
import Logger from '../util/logger';

require('mongoose').Promise = Promise;

export default class UIConnDB {
    static connInst: UIConnDB = null;

    conn: Connection;
    options: ConnectOptions;

    constructor () {
        // let options = config.dataSources.dbOptions.format;
        this.options = config.dataSources.dbOptions;
        this.options.dbName = config.dataSources.ui.dbName;
        this.options.user = config.dataSources.dbInfo.dbUser;
        this.options.pass = config.dataSources.dbInfo.dbPass;

        this.conn = mongoose.createConnection(config.dataSources.dbInfo.uri, this.options);
    }

    static getConn () {
        if (UIConnDB.connInst) {
            return UIConnDB.connInst.conn;
        } else {
            UIConnDB.connInst = new UIConnDB();
            return UIConnDB.connInst.conn;
        }
    }

    async initDB () {
        return new Promise((resolve, reject) => {
            if (!this.conn) {
                this.conn = mongoose.createConnection(config.dataSources.dbInfo.uri, this.options);
            }

            if (config.env === 'dev') {
                mongoose.set('debug', true);
            }

            this.conn.on('disconnected', () => {
                mongoose.connect(config.dataSources.dbInfo.uri);
            });

            this.conn.on('error', (err) => {
                reject(err);
            });

            this.conn.on('open', () => {
                resolve(this.conn);
            });

            this.conn.once('open', () => {
                Logger.info('Connected to MongoDB', config.dataSources.dbInfo.uri);
            });
        });
    }
}
