const Mongoose = require('mongoose')
const Schema = Mongoose.Schema
const findOrCreate = require('mongoose-findorcreate')

const UserSchema = new Schema({
  twitchId: {
    type: String,
    required: true
  },
  login: {
    type: String,
    required: true
  },
  hash: {
    type: String,
    required: true
  },
  logo: {
    type: String
  }
})
UserSchema.plugin(findOrCreate)

module.exports = UserDB = Mongoose.model('User', UserSchema)
