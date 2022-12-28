const { MongoClient, ObjectId } = require("mongodb");

const connectionURL = "mongodb://127.0.0.1:27017";
const databaseName = "task-manager";

// Connect to the DB
MongoClient.connect(connectionURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then((client) => {
    console.log("Connection to the DB has been established!");

    const db = client.db(databaseName);



  })
  .catch((err) => {
    console.log("Unable to connect to DB");
  });
