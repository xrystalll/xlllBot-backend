const config = require('config')
const path = require('path')

const ChannelDB = require(path.join(__dirname, 'models', 'ChannelDB'))
const channels = []

ChannelDB.find()
  .then(data => {
    data.map(i => {
      channels.push(i.name)
    })
  })
  .catch(err => console.error(err))

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
  channels
}
