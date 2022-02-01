import {AzureFunction, Context, HttpRequest, HttpRequestHeaders} from "@azure/functions";
const fetch = require('node-fetch');

const apiKey = process.env["dataHubApiKey"];
const forwardURL = process.env["forwardURL"];

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    let route = context.bindingData.route || '';

    if (!isEmptyObject(req.query)) {
        delete req.query["code"]
    }
    // context.log(`before split ${JSON.stringify(route)}`)
    // route = route.split('/').slice(1).join('/');
    // context.log(`after split ${JSON.stringify(route)}`)

    let url = isEmptyObject(req.query) ? `${forwardURL}/${route}` : `${forwardURL}/${route}?` + new URLSearchParams(req.query);

    const headers: HttpRequestHeaders = {"Authorization": apiKey};

    const response = await fetch(url, {
        method: req.method,
        headers,
        body: JSON.stringify(req.body),
    });

    const respBody = await response.text();

    context.res = {
        status: response.status,
        body: respBody,
    };

};

const isEmptyObject = (obj: Record<string, any>) => {
    for(const i in obj) {
        return false;
    }
    return true;
};

export default httpTrigger;
