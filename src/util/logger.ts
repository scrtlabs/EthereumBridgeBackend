import winston from "winston";
import { createLogger, format, transports } from "winston";
import { consoleFormat } from "winston-console-format";

export const logger = createLogger({
    level: "silly",
    format: format.combine(
        format.timestamp(),
        format.ms(),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
    ),
    defaultMeta: { service: "Test" },
    transports: [
        new transports.Console({
            format: format.combine(
                format.padLevels(),
                consoleFormat({
                    showMeta: true,
                    metaStrip: ["timestamp", "service"],
                    inspectOptions: {
                        depth: Infinity,
                        colors: false,
                        maxArrayLength: Infinity,
                        breakLength: 120,
                        compact: Infinity
                    }
                })
            )
        }),
        //new winston.transports.File({ filename: "debug.log", level: "debug" })
    ]
});

// const options: winston.LoggerOptions = {
//     transports: [
//         new winston.transports.Console({
//             level: process.env.NODE_ENV === "production" ? "error" : "debug"
//         }),
//         new winston.transports.File({ filename: "debug.log", level: "debug" })
//     ]
// };
//
// const logger = winston.createLogger(options);

if (process.env.NODE_ENV !== "production") {
    logger.debug("Logging initialized at debug level");
} else {
    logger.info(`Logging initialized at ${logger.level}`)
}


export default logger;
