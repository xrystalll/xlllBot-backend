const path = require('path')
const TwitchPS = require(path.join(__dirname, 'libs', 'TwitchPS'))
const config = require('config')

const pubsub = new TwitchPS({
  debug: config.get('options.debug'),
  reconnect: config.get('connection.reconnect'),
  init_topics: [{
    topic: 'video-playback.twitch'
  }]
})

setTimeout(() => {
  pubsub.removeTopic([{ topic: 'video-playback.twitch' }])
    .catch(error => console.error(error))
}, 3000)

module.exports = pubsub
