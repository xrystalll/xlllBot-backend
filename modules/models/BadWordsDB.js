const Mongoose = require('mongoose')
const Schema = Mongoose.Schema

const BadWordsSchema = new Schema({
  word: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  channel: {
    type: String,
    required: true
  }
})

module.exports = BadWordsDB = Mongoose.model('Badword', BadWordsSchema)
