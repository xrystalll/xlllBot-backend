const Mongoose = require('mongoose')
const Schema = Mongoose.Schema

const GamesSchema = new Schema({
  game: {
    type: String,
    required: true
  },
  short: {
    type: String,
    required: true
  }
})

module.exports = GamesDB = Mongoose.model('Game', GamesSchema)
