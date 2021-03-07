import {AzureFunction, Context, HttpRequest} from "@azure/functions"
import {MongoClient} from "mongodb";

const mongodbName: string = process.env["mongodbName"];
const mongodbUrl: string = process.env["mongodbUrl"];

interface SignerHealth {
    signer: string,
    health: boolean,
    updated_on: Date,
    from_scrt: boolean,
    to_scrt: boolean
}

interface HealthResponse {
    health: SignerHealth[]
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {

    const client: MongoClient = await MongoClient.connect(mongodbUrl,
        { useUnifiedTopology: true }).catch(
        (err: any) => {
            context.log(err);
            throw new Error("Failed to connect to database");
        }
    );
    const db = await client.db(mongodbName);

    const healthStatus = await db.collection<SignerHealth>("signer_health").find({}).limit(31).toArray().catch(
        (err: any) => {
            context.log(err);
            throw new Error("Failed to get health status from collection");
        }
    );

    context.res = {
        body: {
            health: healthStatus
        }
    };
};

export default httpTrigger;
