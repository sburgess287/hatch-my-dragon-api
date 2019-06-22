'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
app.use(express.json());
const mongoose = require('mongoose');
const morgan = require('morgan');
const passport = require('passport');

const { router: usersRouter } = require('./users');
const { router: authRouter, localStrategy, jwtStrategy } = require('./auth');
app.use(morgan('common'));
mongoose.Promise = global.Promise;

const {CLIENT_ORIGIN, PORT, DATABASE_URL} = require('./config'); 
const { Goal } = require('./goals/models');

// use cors for specific origin rather than all cross origin requests
app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
)

passport.use(localStrategy);
passport.use(jwtStrategy);

app.use('/api/users/', usersRouter);
app.use('/api/auth/', authRouter);

// Passed in to protected endpoint
const jwtAuth = passport.authenticate('jwt', { session: false });

// Test endpoint
app.get('/', (req, res) => {
  res.json({ok: true});
});

// GET endpoint to return list of all goals by logged in user
app.get('/api/goals', jwtAuth, (req, res) => {
  Goal
    .find()
    .where("user_id", req.user.id)
    .then(goals => {
      res.json(goals.map(goal => goal.serialize()))
    })
    .catch(err => {
      console.err(err);
      res.status(500).json({error: 'Internal server error'});
    })
})

// GET endpoint for retrieving Goal by ID for logged in user
app.get('/api/goal/:id', jwtAuth, (req, res) => {
  Goal 
    .findById(req.params.id)
    .then(goal => res.json(goal.serialize()))
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Internal server error'});
    })
  
})

// POST endpoint to Create New Goal for logged in user
app.post('/api/goal', jwtAuth, (req, res) => {
  const requiredFields = ["goal", "count"]
  
  for (let i = 0; i < requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing ${field} in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  }
  
  Goal  
    .create({
      goal: req.body.goal,
      count: req.body.count, // should I set this? default val 0
      user_id: req.user.id, // get from Bearer token
    })
    .then(goal => res.status(201).json(goal.serialize()))
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: `Internal Server Error`});
    })
})

// PUT endpoint to update goal information
app.put('/api/goal/:id', jwtAuth, (req, res) => {
  
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    res.status(400).json({
      error: `Request path id ${req.params.id} and request body id ${req.body.id} values must match`
    })
  }
  const updated = {};
  const updateableFields = ['count'];
  updateableFields.forEach(field => {
    if (field in req.body) {
      updated[field] = req.body[field]
    }
  })
  Goal  
    .findByIdAndUpdate(req.params.id, { $set: updated}, {new: true})
    .then(updatedGoal => res.status(200).json(updatedGoal.serialize()))
    .catch(err => res.status(500).json({ message: `Internal server error`}))
})

// DELETE endpoint for deleting a goal
app.delete('/api/goal/:id', jwtAuth, (req, res) => {
  Goal
    .findByIdAndRemove(req.params.id)
    .then(() => {
      res.status(204).json({ message: 'success'});
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: `Internal server error`});
    })
})


app.use('*', (req, res) => {
  return res.status(404).json({ message: 'Not Found'});
});


// Referenced by both runServer and closeServer.  closeServer
// assumes runServer has run and set `server` to a server object
let server

function runServer(databaseUrl = DATABASE_URL, port=PORT) {

  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
  });
}

function closeServer(){
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer().catch(err => console.error(err));
}
module.exports = { app, runServer, closeServer };