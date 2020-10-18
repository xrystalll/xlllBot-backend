const config = require('config')
const path = require('path')
const { timeFormat } = require(path.join(__dirname, '..', 'Utils'))
const client = require(path.join(__dirname, '..', 'client'))
const request = require('request')

const upTime = (channel, roomId) => {
  request({
    method: 'GET',
    url: 'https://api.twitch.tv/kraken/streams/' + roomId,
    headers: {
      'Client-ID': config.get('bot.client_id'),
      Accept: 'application/vnd.twitchtv.v5+json'
    }
  }, (err, res, body) => {
    if (err) return

    const data = JSON.parse(body)
    const stream = data.stream

    if (stream) client.say(channel, `Стрим начался ${timeFormat(stream.created_at)} назад`)
    else client.say(channel, 'Стрим оффлайн')
  })
}

module.exports = { upTime }
