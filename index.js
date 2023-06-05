const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken')
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY);
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' })
    }

    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })
}


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
        // await client.connect();

        // database collection
        const database = client.db("toysDB");
        const toyCollection = database.collection("toys");
        const categoryCollection = database.collection("category");
        const cartCollection = database.collection("carts");

        // jwt implement
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ token })
        })

        // carts
        app.get('/carts', verifyJWT, async (req, res) => {
            const email = req.query.email;
            if (!email) {
                res.send([]);
            }
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ error: true, message: 'forbidden access' })
            }
            const query = { email: email }
            const result = await cartCollection.find(query).toArray();
            res.send(result)
        })

        app.post('/carts', async (req, res) => {
            const item = req.body;
            const result = await cartCollection.insertOne(item);
            res.send(result)
        })

        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await cartCollection.deleteOne(query);
            res.send(result)

        })

        // create payment intent
        app.post('/create-payment-intent', async (req, res) => {
            const { price } = req.body;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            })
            res.send({
                clientSecret: paymentIntent.client_secret
            })
        })

        //categorys
        app.get('/categorys', async (req, res) => {
            const result = await categoryCollection.find().toArray();
            res.send(result)
        })

        app.post('/categorys', async (req, res) => {
            const category = req.body;
            const result = await categoryCollection.insertOne(category);
            res.send(result)
        })

        app.put('/categorys/:id', async (req, res) => {
            const id = req.params.id;
            const category = req.body;
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
        app.get('/mytoys', verifyJWT, async (req, res) => {
            const email = req.query.email;
            let query = {};

            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ error: true, message: 'forbidden access' })
            }

            if (email) {
                query = { sellerEmail: email };
            }
            const type = req.query.type;
            let result;
            if (type) {
                result = await toyCollection.find(query).sort({ price: type }).toArray();
            }
            else {
                result = await toyCollection.find(query).toArray();
            }
            res.send(result);
        });


        //toyCollection post api
        app.get('/toys', async (req, res) => {
            const limit = parseInt(req.query.limit) || 20;
            const result = await toyCollection.find().limit(limit).toArray();
            res.send(result);
        });


        app.get('/toys/:id', async (req, res) => {
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

        // search api
        app.get('/search', async (req, res) => {
            const toyName = req.query.toyName;
            let query = {};

            if (toyName) {
                query = { toyName: { $regex: toyName, $options: 'i' } };
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