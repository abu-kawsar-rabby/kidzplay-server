const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xvfigcf.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        // database collection
        const database = client.db("toysDB");
        const toyCollection = database.collection("toys");
        const categoryCollection = database.collection("category");

        //categorys
        app.get('/categorys', async (req, res) => {
            const result = await categoryCollection.find().toArray();
            res.send(result)
        })

        app.post('/categorys', async (req, res) => {
            const category = req.body;
            console.log(category);
            const result = await categoryCollection.insertOne(category);
            res.send(result)
        })

        app.put('/categorys/:id', async (req, res) => {
            const id = req.params.id;
            const category = req.body;
            console.log(category)
            const query = { _id: new ObjectId(id) };
            const options = { upsert: true };

            const updatedCategory = {
                $set: {
                    category: category,
                },
            };
            const result = await categoryCollection.updateOne(query, updatedCategory, options);
            res.send(result)

        })
        app.delete('/categorys/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await categoryCollection.deleteOne(query);
            res.send(result)

        })


        //mytoys
        app.get('/mytoys', async (req, res) => {
            const email = req.query.email;
            let query = {};
            if (email) {
                query = { sellerEmail: email };
            }
            const result = await toyCollection.find(query).toArray();
            res.send(result);
        });


        //toyCollection post api
        app.get('/toys', async (req, res) => {
            const result = await toyCollection.find().toArray();
            res.send(result)
        })

        app.get('toys/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await toyCollection.findOne(query);
            res.send(result)
        })

        app.get('/toy', async (req, res) => {
            const subCategory = req.query.subCategory;
            let query = {};
            if (subCategory) {
                query = { subCategory: subCategory };
            }
            const result = await toyCollection.find(query).toArray();
            res.send(result);
        });
        app.get('/search', async (req, res) => {
            const toyName = req.query.toyName;
            let query = {};
            if (toyName) {
                query = { toyName: toyName };
            }
            const result = await toyCollection.find(query).toArray();
            res.send(result);
        });

        app.post('/toys', async (req, res) => {
            const toy = req.body;
            console.log(toy);
            const result = await toyCollection.insertOne(toy);
            res.send(result)
        })

        app.put('/toys/:id', async (req, res) => {
            const id = req.params.id;
            const toy = req.body;
            const query = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedToy = {
                $set: {
                    toyName: toy.toyName,
                    pictureUrl: toy.pictureUrl,
                    sellerName: toy.sellerName,
                    sellerEmail: toy.sellerEmail,
                    subCategory: toy.subCategory,
                    price: toy.price,
                    rating: toy.rating,
                    quantity: toy.quantity,
                    productDescription: toy.productDescription
                },
            };

            const result = await toyCollection.updateOne(query, updatedToy, options);
            res.send(result)

        })
        app.delete('/toys/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await toyCollection.deleteOne(query);
            res.send(result)

        })




        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send(`kidzplay server is running......`)
})


app.listen(port, () => {
    console.log(`kidzplay server is running on port ${port}`)
})