import { AzureFunction, Context } from "@azure/functions";
import { CosmWasmClient } from "secretjs";
import { MongoClient } from "mongodb";

const secretNodeURL: string = process.env["secretNodeURL2"];
const mongodbName: string = process.env["mongodbName"];
const mongodbUrl: string = process.env["mongodbUrl"];

const timerTrigger: AzureFunction = async function (
  context: Context,
  myTimer: any
): Promise<void> {
  const client: MongoClient = await MongoClient.connect(mongodbUrl, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  }).catch((err: any) => {
    context.log(err);
    throw new Error("Failed to connect to database");
  });

  const pairs = (
    await client.db(mongodbName).collection("secretswap_pairs").find().toArray()
  ).map((p) => p._id);

  const secretjs = new CosmWasmClient(secretNodeURL);

  const start = Date.now();
  await Promise.all(
    pairs.map((pairAddress) =>
      secretjs
        .queryContractSmart(pairAddress, { pool: {} })
        .then((pool) =>
          client
            .db(mongodbName)
            .collection("secretswap_pools")
            .updateOne(
              { _id: pairAddress },
              { $set: { _id: pairAddress, ...pool } },
              { upsert: true }
            )
        )
        .then((res) => {})
        .catch((error) => {
          context.log(error);
        })
    )
  );
  context.log("Time it took", (Date.now() - start) / 1000, "seconds");
};

export default timerTrigger;
