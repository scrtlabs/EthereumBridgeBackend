import { AzureFunction, Context } from "@azure/functions";
import { CosmWasmClient } from "secretjs";
import { MongoClient } from "mongodb";

const secretNodeURL: string = process.env["secretNodeURL"];
const mongodbName: string = process.env["mongodbName"];
const mongodbUrl: string = process.env["mongodbUrl"];
const factoryContract: string = process.env["factoryContract"];
const pairCodeId = Number(process.env["pairCodeId"]);

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

  const dbCollection = client.db(mongodbName).collection("secretswap_pairs");
  const pairsInDb = new Set(
    (await dbCollection.find().toArray()).map((p) => p._id)
  );
  const secretjs = new CosmWasmClient(secretNodeURL);

  let pairsAddressesNotInDb: string[];
  try {
    pairsAddressesNotInDb = (await secretjs.getContracts(pairCodeId))
      .filter((p) => p.label.endsWith(`${factoryContract}-${pairCodeId}`))
      .map((p) => p.address)
      .filter((addr) => !pairsInDb.has(addr));
  } catch (e) {
    context.log("secretjs error on getContracts:", e.message);
   await client.close();
    return;
  }

  if (pairsAddressesNotInDb.length === 0) {
    context.log("No new pairs.");
   await client.close();
    return;
  }

  let pairs: any[];
  try {
    pairs = (
      await Promise.all(
        pairsAddressesNotInDb.map((addr) =>
          secretjs.queryContractSmart(addr, { pair: {} })
        )
      )
    ).map((p) => {
      p._id = p.contract_addr;
      return p;
    });
  } catch (e) {
    context.log("secretjs error on queryContractSmart:", e.message);
   await client.close();
    return;
  }

  try {
    const res = await dbCollection.insertMany(pairs, {});
    context.log(res);
  } catch (e) {
    context.log("mongodb error on insertMany:", e.message);
  } finally {
   await client.close();
  }
};

export default timerTrigger;
