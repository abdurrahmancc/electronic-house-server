const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
require("dotenv").config();
const jwt = require("jsonwebtoken");
const verify = require("jsonwebtoken/verify");

// middleware
app.use(express.json());
app.use(cors());

// verify json web token
const verifyJWT = (req, res, next) => {
  if (!req.headers.authentication) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  const inputToken = req.headers.authentication;
  const token = inputToken.split(" ")[1];
  const decoded = jwt.verify(token, process.env.SECRETE_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    if (decoded) {
      req.decoded = decoded;
      next();
    }
  });
  console.log(token);
};

// mongodb connect
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.y5ior.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const productCollection = client.db("electronicHouse").collection("products");

    //login
    app.post("/login", (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.SECRETE_TOKEN, { expiresIn: "1d" });
      res.send({ token });
    });

    //get my all items
    app.get("/items", verifyJWT, async (req, res) => {
      const email = req.query.email;
      console.log(email);
      const filter = { email: email };
      const cursor = productCollection.find(filter);
      const result = await cursor.toArray();
      res.send(result);
    });

    //post product
    app.post("/products", async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      res.send(result);
    });

    //delete product
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    });

    // product update
    app.put("/product/:id", async (req, res) => {
      const inputId = req.params.id;
      const quantity = req.body.quantity;
      const filter = { _id: ObjectId(inputId) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          quantity: quantity,
        },
      };
      const result = await productCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    //get all product
    app.get("/products", async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("running my node server");
});

app.listen(port, () => {
  console.log("server running port", port);
});
