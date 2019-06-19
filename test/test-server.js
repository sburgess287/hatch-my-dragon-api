'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');
const faker = require('faker');
const mongoose = require('mongoose');

const {app, runServer, closeServer} = require('../server');
const { User } = require('../users');
const { JWT_SECRET, TEST_DATABASE_URL } = require('../config');
const { Goal } = require('../goals/models');

const expect = chai.expect;

chai.use(chaiHttp);

// Seed the database using Faker library
function seedGoalData(){
  console.info('seeding card data');
  const seedData = [];
  for (let i=1; i<=5; i++){
    seedData.push(generateGoalData());
  }
  return Goal.insertMany(seedData);
}

// Generate object representing a Goal
function generateGoalData(){
  return {
    goal: faker.lorem.text(),
    count: 0, 
    
  }
}

// Delete database/TearDown
function tearDownDb(){
  console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
}

// First sample tests
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

describe('Card API resource', function() {

  const username = "testUser";
  const password = 'testPass';

  const token = jwt.sign(
    {
      user: {
        username
      }
    }, 
    JWT_SECRET,
    {
      algorithm: 'HS256',
      subject: username
    }
  )

  before(function() {
    return runServer(TEST_DATABASE_URL);
  })

  beforeEach(function() {
    return seedGoalData();
  })

  beforeEach(function() {
    return User.hashPassword(password).then(password => 
      User.create({
        username, 
        password
      })
    )
  })

  afterEach(function() {
    return User.remove({})
  })

  afterEach(function() {
    return tearDownDb();
  })

  after(function() {
    return closeServer();
  })

  // Test GET endpoint
  describe('GET Endpoint', function(){
    const token = jwt.sign(
      {
        user: {
          username
        }
      }, 
      JWT_SECRET,
      {
        algorithm: 'HS256',
        subject: username,
        expiresIn: '7d'
      }
    )

    it('Should return all goals for the user', function() {
      let res;
      return chai.request(app)
        .get('/api/goals')
        .set('Authorization', `Bearer ${token}`)
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res.body).to.have.lengthOf.at.least(1);
          return Goal.count();
        })
      .then(function(count) {
        expect(res.body).to.have.lengthOf(count);
      })
    })

    it('Should return goals with correct fields', function() {
      const token = jwt.sign(
        {
          user: {
            username
          }
        }, 
        JWT_SECRET,
        {
          algorithm: 'HS256',
          subject: username,
          expiresIn: '7d'
        }
      )

      let resGoal;
      return chai.request(app)
        .get('/api/goals')
        .set('Authorization', `Bearer ${token}`)
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.lengthOf.at.least(1)

          res.body.forEach(function(goal) {
            expect(goal).to.be.a('object');
            expect(goal).to.include.keys(
              'id', 'goal', 'count')
            })
          // set resGoal to 1st goal in the array
          resGoal = res.body[0];
          return Goal.findById(resGoal.id);
        })
        // verify id of the response is same as 1st in database
        .then(function(goal) {
          expect(resGoal.id).to.equal(goal.id);
          expect(resGoal.goal).to.equal(goal.goal);
          expect(resGoal.count).to.equal(goal.count);
        })
    })   
  })

  // POST endpoint, protected per user
  describe('POST endpoint', function() {
    // Make POST request with data
    // prove response object has correct keys
    // verify ID is returned as well
    const token = jwt.sign(
      {
        user : {
          username
        }
      },
      JWT_SECRET,
      {
        algorithm: 'HS256',
        subject: username, 
        expiresIn: '7d'
      }
    )

    it('Should create a new Goal', function() {
      const newGoal = {
        goal: faker.lorem.text(),
        count: 0, 
      }

      return chai.request(app)
        .post('/api/goal')
        .set('Authorization', `Bearer ${token}`)
        .send(newGoal)
        .then(function(res) {
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys(
            'id', 'goal', 'count')
          expect(res.body.goal).to.equal(newGoal.goal);
          expect(res.body.count).to.equal(newGoal.count);
        })
    })


  })

  // DELETE endpoint 
  describe('DELETE endpoint', function() {
    const token = jwt.sign(
      {
        user : {
          username
        }
      },
      JWT_SECRET,
      {
        algorithm: 'HS256',
        subject: username, 
        expiresIn: '7d'
      }
    )
    
    // Get card by id
    // Make DELETE request for that id
    // assert response code
    // Verify Goal with that ID is no longer in the db
    it('deletes a Goal by ID', function() {
      let savedGoal;
      return chai.request(app)
        .post('/api/goal')
        .set('Authorization', `Bearer ${token}`)
      return Goal
        .findOne()
        .then(function(_savedgoal) {
          savedgoal = _savedgoal;
          return chai.request(app).delete(`/api/goal${savedgoal.id}`)
        })
        .then(function(res) {
          expect(res).to.have.status(204)
          return Goal.findById(savedgoal.id);
        })
        .then(function(_savedgoal) {
          expecte(_savedgoal).to.be.null;
        })
    })
  })

  // Test PUT endpoint (by user)
  describe('PUT endpoint', function() {
    // get existing goal from the db
    // make PUT request to update the card
    // verify the response
    // verify the goal in the db is updated correctly
    it('should update progress for the goal', function() {
      const token = jwt.sign(
        {
          user : {
            username
          }
        },
        JWT_SECRET,
        {
          algorithm: 'HS256',
          subject: username, 
          expiresIn: '7d'
        }
      )
    
    const updatedGoal = {
      count: 1
    }

    return Goal
      .findOne()
      .then(function(goal) {
        updatedGoal.id = goal.id;
        // make request and inspect response and data
        return chai.request(app)
          .put(`/api/goal/${goal.id}`)
          .set('Authorization', `Bearer ${token}`)
          .send(updatedGoal);
      })
      .then(function(res) {
        expect(res).to.have.status(200);
        return Goal.findById(updatedGoal.id);
      })
      .then(function(goal){
        expect(goal.count).to.equal(updatedGoal.count);  
      })
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
})

