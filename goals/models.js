"use strict"

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

// Schema for goals
const goalSchema = mongoose.Schema({
  goal: { type: String, required: true}, 
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  count: { type: Number }
})

// goal instance method to create goal object
goalSchema.methods.serialize = function() {
  return {
    id: this.id,
    goal: this.goal,
    count: this.count,
    user_id: this.user_id

  }
}

const Goal = mongoose.model("goal", goalSchema);

module.exports = { Goal };