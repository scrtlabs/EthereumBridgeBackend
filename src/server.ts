import errorHandler from "errorhandler";
import process from "process";
import app from "./app";
import logger from "./util/logger";

/**
 * Error Handler. Provides full stack - remove for production
 */
app.use(errorHandler());

/**
 * Start Express server.
 */
const server = app.listen(app.get("port"), () => {
    if (process.env.NODE_ENV === "dev") {
        //setupLocalEnv();
        logger.info(`App is running at http://localhost:${app.get("port")} in ${app.get("env")} mode`);
        logger.info("  Press CTRL-C to stop\n");
    } else {
        logger.info(`App is running at http://localhost:${app.get("port")} in ${app.get("env")} mode`);
        logger.info("  Press CTRL-C to stop\n");
        //logger.info(`App is running in ${app.get("env")} mode`);
    }
});


process.on("SIGINT", () => {
    logger.info("Interrupted");
    process.exit(0);
});

export default server;
