const tmi = require('tmi.js')
const config = require('config')

const client = new tmi.client({
  options: {
    debug: config.get('options.debug')
  },
  connection: {
    secure: config.get('connection.secure'),
    reconnect: config.get('connection.reconnect')
  },
  identity: {
    username: config.get('bot.username'),
    password: config.get('bot.oauth_token')
  },
  channels: []
})

module.exports = client
