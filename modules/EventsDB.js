const Mongoose = require('mongoose')
const Schema = Mongoose.Schema

const EventsSchema = new Schema({
  channel: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  }
})

module.exports = EventsDB = Mongoose.model('Event', EventsSchema)
