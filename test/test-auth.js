'use strict'

const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');

const {app, runServer, closeServer} = require('../server');
const { User } = require('../users');
const { JWT_SECRET, TEST_DATABASE_URL } = require('../config');
const { Goal } = require('../goals/models');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Auth endpoints', function () {
  const username = 'TestUser'; 
  const password = 'TestPassword';

  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return User.hashPassword(password).then(password => 
      User.create({
        username,
        password
      })
    )
  })

  afterEach(function() {
    return User.remove({});
  });

  after(function() {
    return closeServer();
  })

  describe('auth/login', function() {
    it('should reject requests with no credentials', function() {
      return chai
        .request(app)
        .post('/api/auth/login')
        .then((res) => {
          expect(res).to.have.status(400);
        })
    })

    it('should reject requests with incorrect username', function() {
      return chai
        .request(app)
        .post('/api/auth/login')
        .send({ username: 'wrongUsername', password})
        .then((res) => {
          expect(res).to.have.status(401);
        })
    })
  })

  




})