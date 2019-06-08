'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');

const {app, runServer, closeServer} = require('../server');
const { User } = require('../users');
const { JWT_SECRET, TEST_DATABASE_URL } = require('../config');

const expect = chai.expect;

chai.use(chaiHttp);


// these tests are failing
describe('Example test to show connection to test DB', function() {

  before(function() {
    return runServer(TEST_DATABASE_URL)
  });

  after(function() {
    return closeServer();
  })

  afterEach(function () {
    return User.remove({})
  })


  it('page exists and returns 200', function() {
    return chai 
      .request(app)
      .get('/')
      .then(function(res) {
        expect(res).to.have.status(200);
        
      })
    
  })
})

describe('API', function() {

  it('should 404 on GET requests without authentication on invalid pages', function() {
    return chai.request(app)
      .get('/api/fooooo')
      .then(function(res) {
        expect(res).to.have.status(404);
        expect(res).to.be.json;
        
      });
  });

  it('should 401 on GET requests to valid pages without authentication', function() {
    return chai 
      .request(app)
      .get('/api/goals')
      .then(function(res) {
        expect(res).to.have.status(401);
        
      })
    
  })
});