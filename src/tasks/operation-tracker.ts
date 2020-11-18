// const mongoConnectionString = 'mongodb://127.0.0.1/agenda';
//
// const agenda = new Agenda({db: {address: mongoConnectionString}});
//
// // Or override the default collection name:
// // const agenda = new Agenda({db: {address: mongoConnectionString, collection: 'jobCollectionName'}});
//
// // or pass additional connection options:
// // const agenda = new Agenda({db: {address: mongoConnectionString, collection: 'jobCollectionName', options: {ssl: true}}});
//
// // or pass in an existing mongodb-native MongoClient instance
// // const agenda = new Agenda({mongo: myMongoClient});
//
// agenda.define('delete old users', async job => {
//     await User.remove({lastLogIn: {$lt: twoDaysAgo}});
// });
//
// (async function() { // IIFE to give access to async/await
//     await agenda.start();
//
//     await agenda.every('3 minutes', 'delete old users');
//
//     // Alternatively, you could also do:
//     await agenda.every('*/3 * * * *', 'delete old users');
// })();
