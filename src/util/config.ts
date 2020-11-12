// config.js
require("dotenv").config();
import convict from "convict";

const config = convict({
    env: {
        format: ["prod", "dev", "test"],
        default: "dev",
        arg: "nodeEnv",
        env: "NODE_ENV"
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
    dbName: {
        format: String,
        default: "",
        arg: "dbName",
        env: "MONGODB_NAME"
    },
    port: {
        format: Number,
        default: 3000,
        arg: "port",
        env: "PORT"
    },
    db: {
        format: String,
        default: "",
        arg: "db",
        env: "DB_URL"
    }
});

const env = config.get("env");
config.loadFile(`./config/${env}.json`);

config.validate({ allowed: "strict" }); // throws error if config does not conform to schema

export = config.getProperties();
