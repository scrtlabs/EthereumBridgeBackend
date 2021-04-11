const sushiData = require('@sushiswap/sushi-data');

module.exports = async function (context, req) {
   context.log('JavaScript HTTP trigger function processed a request.');

    const address = req.query.address;
    context.log(address)
    try {
        let resp = await sushiData.masterchef.pool({ pool_address: address });

        context.res = {
            status: 200, /* Defaults to 200 */
            body: JSON.parse(JSON.stringify(resp, (key, value) =>
                typeof value === 'bigint'
                    ? value.toString()
                    : value)), // return everything else unchanged,
            headers: {
                'Content-Type': 'application/json'
            }
        };
    } catch (e) {
        context.res = {status: 500, body: `Error: ${e}`}
    }
}
