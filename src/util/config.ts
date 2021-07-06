import fs from "fs";

//require("dotenv").config();
import convict from "convict";

const config = convict({
    env: {
        format: ["production", "dev", "test"],
        default: "dev",
        arg: "nodeEnv",
        env: "NODE_ENV"
    },

    port: {
        format: 'port',
        default: 8000,
        arg: "port",
        env: "PORT"
    },

    ethProvider: {
        format: String,
        default: "",
        arg: "eth_provider",
        env: "ETH_PROVIDER"
    },
    walletAddress: {
        format: String,
        default: "",
        arg: "walletAddress",
        env: "WALLET_ADDRESS"
    },
    appUrl: {
        format: String,
        default: "http://localhost:3000",
        arg: "appUrl",
        env: "APP_URL"
    },
    dataSources: {
        dbInfo: {
            uri: {
                format: String,
                default: "",
                arg: "uri",
                env: "MONGODB_URL"
            },
            dbUser: {
                format: String,
                default: "",
                arg: "dbuser",
                env: "MONGODB_USER"
            },
            dbPass: {
                format: String,
                default: "",
                arg: "dbpass",
                env: "MONGODB_PASS"
            },
        },
        dbOptions: {
            format: '*',
            default: {}
        },
        bridge: {
            dbName: {
                format: String,
                default: "bridge",
                arg: "dbname",
                env: "MONGODB_NAME_BRIDGE"
            },
        },
        secretswap: {
            dbName: {
                format: String,
                default: "secretswap",
                arg: "dbname",
                env: "MONGODB_NAME_SECRETSWAP"
            },
        },
        ui: {
            dbName: {
                format: String,
                default: "ui",
                arg: "dbname",
                env: "MONGODB_NAME_UI"
            },
        }
    }
});

const env = config.get("env");

if (fs.existsSync(`./config/${env}.json`)) {
    config.loadFile(`./config/${env}.json`);
}

config.validate({ allowed: "strict" }); // throws error if config does not conform to schema

export = config.getProperties();
