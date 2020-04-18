const Mongoose = require('mongoose')
const Schema = Mongoose.Schema

const SettingsSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  state: {
    type: Boolean,
    required: true
  },
  description: {
    type: String
  },
  channel: {
    type: String,
    required: true
  }
})

module.exports = SettingsDB = Mongoose.model('Setting', SettingsSchema)
