const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const UserSchema = mongoose.Schema({
  username: {
    type: String, 
    required: true, 
    unique: true
  }, 
  password: {
    type: String, 
    required: true
  },
});

// Return username and id to reference
UserSchema.methods.serialize = function() {
  return {
    username: this.username || '',
    id: this.id
  };
};

// Method returns boolean value if pw is valid
UserSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password)
}

// Set number of rounds of salting algorithm to be used
UserSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
}

const User = mongoose.model('User', UserSchema);

// export all methods above for use in app
module.exports = {User};