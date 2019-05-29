// Users router
'use strict'; 
const express = require('express');
const bodyParser = require('body-parser');

const {User} = require('./models');

const router = express.Router();

const jsonParser = bodyParser.json();

// Post to register/sign up new user
router.post('/', jsonParser, (req, res) => {
  const requiredFields = ['username', 'password'];
  const missingField = requiredFields.find(field => !(field in req.body));

  if (missingField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError', 
      message: 'Missing field', 
      location: missingField
    });
  }

  const stringFields = ['username', 'password'];

  const nonStringField = stringFields.find(
    field => field in req.body && typeof req.body[field] !== 'string'
  );

  if(nonStringField) {
    return res.status(422).json({
      code: 422, 
      reason: 'ValidationError', 
      message: 'Incorrect field type: expected string',
      location: nonStringField
    })
  }

  // Trim username and password of accidental spaces (user error)
  const explicitelyTrimmedFields = ['username', 'password'];
  const nonTrimmedField = explicitelyTrimmedFields.find(
    field => req.body[field].trim() !== req.body[field]
  );

  if (nonTrimmedField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Cannot start or end with whitespace',
      location: nonTrimmedField
    });
  }

  const sizedFields = {
    username: {
      min: 1
    },
    password: {
      min: 6, // todo: change this back to 10?
      max: 72
    }
  }

  const tooSmallField = Object.keys(sizedFields).find(
    field => 
      'min' in sizedFields[field] &&
        req.body[field].trim().length < sizedFields[field].min
  );

  const tooLargeField = Object.keys(sizedFields).find(
    field => 
      'max' in sizedFields[field] &&
        req.body[field].trim().length > sizedFields[field].max
  );

  if (tooSmallField || tooLargeField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError', 
      message: tooSmallField
        ? `Must be at least ${sizedFields[tooSmallField].min} characters long`
        : `Must be at most ${sizedFields[tooLargeField].max} characters long`,
      location: tooSmallField || tooLargeField
    });
  }

  let {username, password} = req.body;
  return User.find({username})
    .count()
    .then(count => {
      if (count > 0) {
        // Reject if duplicate name found
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'Username already taken', 
          location: 'username',
        });
      }
      // if there is no existing user, hash the password
      return User.hashPassword(password);
    })
    .then(hash => {
      return User.create({
        username, 
        password: hash, // set PW to hashed value
      })
    })
    .then(user => {
      return res.status(201).json(user.serialize());
    })
    .catch(err => {
      // forward validation to client, otherwise return 500 error
      if (err.reason === `ValidationError`) {
        return res.status(err.code).json(err);
      }
      res.status(500).json({code: 500, message: 'Internal server error'});
    });
});

module.exports = {router};