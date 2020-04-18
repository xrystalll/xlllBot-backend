const Mongoose = require('mongoose')
const Schema = Mongoose.Schema

const CommandSchema = new Schema({
  tag: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  channel: {
    type: String,
    required: true
  }
})

module.exports = CommandDB = Mongoose.model('Command', CommandSchema)
