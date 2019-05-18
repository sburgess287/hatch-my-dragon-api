'use strict'

module.exports = {
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000'
};

exports.DATABASE_URL = 
  process.env.DATABASE_URL || "mongodb://localhost/hatchmydragon-app"
exports.TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || "mongodb://localhost/hatchmydragon-test";

exports.PORT = process.env.PORT || 3000;