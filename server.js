const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const {CLIENT_ORIGIN, PORT} = require('./config');



// use cors for specific origin rather than all cross origin requests
app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
)

app.get('/api/*', (req, res) => {
  res.json({ok: true});
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

module.exports = {app};