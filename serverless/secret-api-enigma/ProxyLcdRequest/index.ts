import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import fetch from "node-fetch";
import { Agent } from 'https';

const httpsAgent = new Agent({
    rejectUnauthorized: false,
});

const forwardURL = `${process.env["forwardURL"]}`

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    let route = context.bindingData.route;
    const response = await fetch(`${forwardURL}/${route}`, {
        method: req.method,
        headers: req.headers,
        query: req.query,
        body: req.body,
        agent: httpsAgent
    });

    const respBody = await response.text();

    context.res = {
        status: response.status,
        body: respBody
    }

    // if (response.ok) {
    //     context.res = {
    //         status: response.status,
    //         body: respBody
    //     }
    // } else {
    //
    // }
};

export default httpTrigger;
