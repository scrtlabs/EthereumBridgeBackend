import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import fetch from "node-fetch";
import { Agent } from "https";

const httpsAgent = new Agent({
    rejectUnauthorized: false,
    minVersion: "TLSv1"
});

const forwardURL = `${process.env["forwardURL"]}`;

const isEmptyObject = (obj: Record<string, any>) => {
    for(const i in obj) {
        return false;
    }
    return true;
};

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const route = context.bindingData.route;

    // if (req.method === "POST") {
    //     context.log(req.query);
    // }

    const url = isEmptyObject(req.query) ? `${forwardURL}/${route}` : `${forwardURL}/${route}?` + new URLSearchParams(req.query);

    // if (req.method === "POST") {
    //     context.log(url);
    //     context.log(req.body);
    // }

    const response = await fetch(url, {
        method: req.method,
        headers: req.headers,
        body: JSON.stringify(req.body),
        agent: httpsAgent
    });

    const respBody = await response.text();

    context.res = {
        status: response.status,
        body: respBody
    };

};

export default httpTrigger;
