import { AzureFunction, Context } from "@azure/functions";
import { CosmWasmClient } from "secretjs";
import { MongoClient } from "mongodb";

const secretNodeURL: string = process.env["secretNodeURL"];
const mongodbName: string = process.env["mongodbName"];
const mongodbUrl: string = process.env["mongodbUrl"];
const factoryContract: string = process.env["factoryContract"];
const pairCodeId: number = Number(process.env["pairCodeId"]);

const timerTrigger: AzureFunction = async function (
  context: Context,
  myTimer: any
): Promise<void> {
  const client: MongoClient = await MongoClient.connect(mongodbUrl,
      { useUnifiedTopology: true }).catch(
      (err: any) => {
        context.log(err);
        throw new Error("Failed to connect to database");
      }
  );

  const dbCollection = client.db(mongodbName).collection("secretswap_pairs");
  const pairsInDb = new Set(
    (await (await dbCollection.find()).toArray()).map((p) => p._id)
  );
  const secretjs = new CosmWasmClient(secretNodeURL);

  const pairsAddressesNotInDb = (await secretjs.getContracts(pairCodeId))
    .filter((p) => p.label.endsWith(`${factoryContract}-${pairCodeId}`))
    .map((p) => p.address)
    .filter((addr) => !pairsInDb.has(addr));

  if (pairsAddressesNotInDb.length === 0) {
    context.log("No new pairs.");
    return;
  }

  const pairs = (
    await Promise.all(
      pairsAddressesNotInDb.map((addr) =>
        secretjs.queryContractSmart(addr, { pair: {} })
      )
    )
  ).map((p) => {
    p._id = p.contract_addr;
    return p;
  });

  const res = await dbCollection.insertMany(pairs);
  context.log(res);
};

export default timerTrigger;
