'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const morgan = require('morgan');
const passport = require('passport');

const { router: usersRouter } = require('./users');
const { router: authRouter, localStrategy, jwtStrategy } = require('./auth');

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
app.get('/api/*', (req, res) => {
  res.json({ok: true});
});

// GET endpoint for all goals by that user
app.get("/goals", jwtAuth, (req, res) => {
  Goal
    .find()
    .where("user_id", req.user.id)
    .then(goals => {
      res.json(goals.map(goal => goal.serialize()))
    })
    .catch(err => {
      console.err(err);
      res.status(500).json({error: 'something went wrong'});
    })
})

// GET endpoint for retrieving Goal by ID
app.get("/goals/:id", jwtAuth, (req, res) => {
  Goal 
    .findById(req.params.id)
    .then(goal => res.json(goal.serialize()))
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: '500 server error'});
    })
  
})

// POST endpoint for goals
app.post('/goal', jwtAuth, (req, res) => {
  const requiredFields = ["goal", "count"] // should I add count?
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
      count: req.body.count,
      user_id: req.user.id, // get from Bearer token
    })
    .then(goal => res.status(201).json(goal.serialize()))
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: `Internal Server Error`});
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