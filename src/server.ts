import errorHandler from "errorhandler";

import app from "./app";
import logger from "./util/logger";
//import {Swap} from "./models/Swap";

/**
 * Error Handler. Provides full stack - remove for production
 */
app.use(errorHandler());

// function setupLocalEnv() {
//     // clear document
//     Swap.deleteMany({}, () => {
//         // add test user
//         const be = new ClientDbObj({
//             appkey: "testappkey",
//             name: "testCustomer",
//             users: []
//         });
//
//         be.save((err) => {
//                 if (err) {
//                     logger.error(`Failed to save test user to DB: ${err}`);
//                 } else {
//                     logger.info("Saved test user successfully");
//                 }
//             }
//         );
//     });
// };

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

export default server;
