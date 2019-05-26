'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const morgan = require('morgan');

const { router: usersRouter } = require('./users');
const { router: authRouter, localStrategy, jwtStrategy } = require('./auth');

mongoose.Promise = global.Promise;

const {CLIENT_ORIGIN, PORT, DATABASE_URL} = require('./config');


// use cors for specific origin rather than all cross origin requests
app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
)

// Test endpoint
app.get('/api/*', (req, res) => {
  res.json({ok: true});
});

app.use('/api/users', usersRouter);
app.use('/api/auth/', authRouter);

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