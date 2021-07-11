import { AzureFunction, Context } from "@azure/functions"
import fetch from "node-fetch";

const bridgeUrl = `${process.env["bridgeUrl"]}`;

interface healthStatus {
    overall: string,
    SecretLeader: string,
    EtherLeader: string,
    "SecretSigner-leader": string,
    "EtherSigner-0x9d0": string,
    "eth-balance": string
}

const timerTrigger: AzureFunction = async function (_: Context, __: any): Promise<void> {

    const healthStatus: healthStatus = await(await fetch(bridgeUrl).catch(
        (_) => {
            throw new Error("Failed to get health status - is service running?");
        }
    )).json();

    if (healthStatus.overall !== "pass")
    {
        throw new Error("Service health check failed!");
    }

    if (Number(healthStatus["eth-balance"]) < 0.1 ) {
        throw new Error("Signer is running low on funds!");
    }
};

export default timerTrigger;
