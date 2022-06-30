const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const express = require('express')
const cors = require('cors');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zxcwv.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorozed access' })
  }
  const token = authHeader.split(' ')[1]
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded
    next()
  });
}

async function run() {
  try {
    await client.connect();
    const userCollection = client.db('TaskManagement').collection('User')
    const AddTaskCollection = client.db('TaskManagement').collection('Task')
    const AddCompleteTask = client.db('TaskManagement').collection('CompleteTask')



    // GET ALL USER
    app.get('/user', async (req, res) => {
      const users = await userCollection.find().toArray()
      res.send(users)
    })

    // GET CREATE USER EMAIL
    app.put('/user/:email', async (req, res) => {
      const email = req.params.email
      const user = req.body
      const filter = { email: email }
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options)
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15d' })
      console.log(token, process.env.ACCESS_TOKEN_SECRET);
      res.send({ result, token })
    })

    // GET UPDATE INFO SEND FOR UI  
    app.get('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email })
      res.send(user)
    })

    // Add new Task
    app.post('/task', async (req, res) => {
      const newTask = req.body
      console.log('add', newTask)
      const result = await AddTaskCollection.insertOne(newTask)
      res.send(result)
    })

    // GET new Task
    app.get('/task', async (req, res) => {
      const query = {}
      const cursor = AddTaskCollection.find(query)
      const Task = await cursor.toArray()
      res.send(Task)
    })


    //    // Add new Complete Task
    // app.post('/complete-task', async (req, res) => {
    //   const newTask = req.body
    //   console.log('add', newTask)
    //   const result = await AddCompleteTask.insertOne(newTask)
    //   res.send(result)
    // })

    // Update Task
    app.put('/task/:id', async (req, res) => {
      const id = req.params.id;
      const updateTask = req.body;
      console.log(updateTask);
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set:
          updateTask,
      };
      const result = await AddTaskCollection.updateOne(filter, updatedDoc, options);
      res.send(result);
    })
    // Update Task for ui show
    app.get('/task/:id', async(req, res) => {
      const id =req.params.id
      const query = {_id: ObjectId(id)}
      const result =await AddTaskCollection.findOne(query)
      res.send(result)
  })

  }
  finally {

  }
}

run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello Facility Server')
})

app.listen(port, () => {
  console.log(`Hello Facility listening on port ${port}`)
})