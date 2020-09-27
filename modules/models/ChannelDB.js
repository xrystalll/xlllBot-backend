const Mongoose = require('mongoose')
const Schema = Mongoose.Schema

const ChannelSchema = new Schema({
  name: {
    type: String,
    required: true
  }
})

module.exports = ChannelDB = Mongoose.model('Channel', ChannelSchema)
