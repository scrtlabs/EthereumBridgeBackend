var mongodb = require("mongodb");
var MongoClient = require("mongodb").MongoClient;


module.exports = async (context, myTimer) => {

    let client = await MongoClient.connect(`${process.env["mongodbUrl"]}`).catch(
        (err) => {
            return context.error(err);
        }
    )
    const db = await client.db(`${process.env["mongodbName"]}`)

    let tokens = await db.collection("token_pairing").find({}).limit(20).toArray().catch(
        (err) => {
            return context.error(err);
        }
    );
    context.log(tokens)

    let timeStamp = new Date().toISOString();
    context.log('JavaScript timer trigger function ran!', timeStamp);   
};