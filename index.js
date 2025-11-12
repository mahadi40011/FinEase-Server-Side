const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mv5kzxg.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("FinEase Server is running");
});

async function run() {
  try {
    await client.connect();

    const database = client.db("FinEase_DB");
    const TransactionCollection = database.collection("Transactions");

    // post a data
    app.post("/add-transaction", async (req, res) => {
      const newTransaction = req.body;
      const result = await TransactionCollection.insertOne(newTransaction);
      res.send(result);
    });

    // get all data
    app.get("/my-transactions", async (req, res) => {
      const email = req.query.email;
      const { sortBy, order } = req.query;

      let cursor = TransactionCollection.find({ email });

      if (sortBy) {
        const sortOrder = order === "asc" ? 1 : -1;
        cursor = cursor.sort({ [sortBy]: sortOrder });
      }

      const result = await cursor.toArray();
      res.send(result);
    });

    //get income and expense overview
    app.get("/my-overview",async (req, res) => {
      const { email } = req.query;
      const expectedFields = {
        type: 1,
        amount: 1,
      };
      const cursor = TransactionCollection.find({ email }).project(
        expectedFields
      );
      const result = await cursor.toArray();
      res.send(result);
    });

    //get Total Amount of a Category
    app.get("/category-total-amount",async (req, res) => {
      const { email, category } = req.query;
      const expectedFields = {
        amount: 1,
      };
      const cursor = TransactionCollection.find({ email, category }).project(
        expectedFields
      );
      const result = await cursor.toArray();
      res.send(result);
    });

    // get single data
    app.get("/transaction/:id", async (req, res) => {
      const id = req.params.id;
      const email = req.query.email;
      const query = { _id: new ObjectId(id) };
      const result = await TransactionCollection.findOne(query);
      res.send(result);
    });

    // get one field of a data
    app.get("/my-reports", async (req, res) => {
      const email = req.query.email;
      const expectedFields = {
        type: 1,
        amount: 1,
        date: 1,
      };
      const cursor = TransactionCollection.find({ email: email }).project(
        expectedFields
      );
      const result = await cursor.toArray();
      res.send(result);
    });

    // updata a data
    app.patch("/transaction/update/:id", async (req, res) => {
      const id = req.params.id;
      const updateTransaction = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          type: updateTransaction.type,
          category: updateTransaction.category,
          description: updateTransaction.description,
          amount: updateTransaction.amount,
          date: updateTransaction.date,
        },
      };
      const result = await TransactionCollection.updateOne(query, update);
      res.send(result);
    });

    // delete a data
    app.delete("/transaction/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await TransactionCollection.deleteOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, (req, res) => {
  console.log("server is running on port", port);
});
