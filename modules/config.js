const config = require('config')

module.exports = {
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
}
