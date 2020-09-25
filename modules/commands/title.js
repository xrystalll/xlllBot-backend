const config = require('config')
const path = require('path')
const { checkSettings } = require(path.join(__dirname, '..', 'Utils'))
const client = require(path.join(__dirname, '..', 'client'))
const request = require('request')

const title = (channel, roomId, args) => {
  if (args.length === 0) return

  const status = args.join(' ')
  const streamObject = {"channel": { status, "channel_feed_enabled": true }}

  checkSettings(channel, 'changetitle').then(bool => {
    if (bool) {
      request({
        url: 'https://api.twitch.tv/kraken/channels/' + roomId,
        method: 'PUT',
        headers: {
          Accept: 'application/vnd.twitchtv.v5+json',
          Authorization: 'OAuth ' + config.get('bot.oauth_token'),
          'Client-ID': config.get('bot.client_id'),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(streamObject)
      }, (err, res, body) => {
        if (err) return

        client.say(channel, `Установлено название стрима: ${title}`)
      })
    } else client.say(channel, 'Возможность менять название стрима командой выключена!')
  })
}

module.exports = { title }
