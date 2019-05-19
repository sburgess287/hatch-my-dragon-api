const chai = require('chai');
const chaiHttp = require('chai-http');

const {app, runServer, closeServer} = require('../server');
const { TEST_DATABASE_URL } = require('../config');

const should = chai.should();
chai.use(chaiHttp);

const expect = chai.expect;

// Delete the database/Teardown
function tearDownDb() {
  console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
}

// these tests are failing
describe('Example test to show connection to test DB', function() {

  before(function() {
    return runServer(TEST_DATABASE_URL)
  })

  // seedCardData function not written yet
  // beforeEach(function() {
  //   return seedCardData();
  // })

  afterEach(function() {
    return tearDownDb;
  })

  after(function() {
    return closeServer();
  })

  it('page exists', function() {
    return chai 
      .request(app)
      .get('/api/')
      .then(function(res) {
        expect(res).to.have.status(200);
        
      })
    
  })
})

describe('API', function() {

  it('should 200 on GET requests', function() {
    return chai.request(app)
      .get('/api/fooooo')
      .then(function(res) {
        res.should.have.status(200);
        res.should.be.json;
      });
  });

  it('page exists', function() {
    return chai 
      .request(app)
      .get('/api/')
      .then(function(res) {
        expect(res).to.have.status(200);
        
      })
    
  })
});