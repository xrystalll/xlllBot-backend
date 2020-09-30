const config = require('config')
const path = require('path')
const { timeFormat } = require(path.join(__dirname, '..', 'Utils'))
const client = require(path.join(__dirname, '..', 'client'))
const request = require('request')

const old = (channel, state, args, checkBroadcasterPermission) => {
  const userId = state.user['user-id']
  const roomId = state.user['room-id']
  const userName = state.user.username
  const targetUser = args[0] ? args[0].replace('@', '') : undefined

  if (!targetUser) {
    if (checkBroadcasterPermission()) {
      client.say(channel, `@${userName} ты хочешь узнать подписан ли ты сам на себя? FailFish`)
      return
    }

    request({
      url: `https://api.twitch.tv/kraken/users/${userId}/follows/channels/${roomId}`,
      method: 'GET',
      headers: {
        Accept: 'application/vnd.twitchtv.v5+json',
        'Client-ID': config.get('bot.client_id')
      }
    }, (err, res, body) => {
      if (err) return

      const data = JSON.parse(body)

      if (!data.error) {
        client.say(channel, `@${userName} подписан на канал ${channel} ${timeFormat(data.created_at)} B)`)
      } else {
        client.say(channel, `@${userName} ты не подписан NotLikeThis`)
      }
    })
  } else {
    if (targetUser === userName) {
      client.say(channel, `@${userName} подписан ли ${targetUser} сам на себя? CoolStoryBob`)
      return
    }

    request({
      url: `https://api.twitch.tv/kraken/users?login=${targetUser}`,
      method: 'GET',
      headers: {
        Accept: 'application/vnd.twitchtv.v5+json',
        'Client-ID': config.get('bot.client_id')
      }
    }, (err, res, body) => {
      if (err) return

      if (res && res.statusCode === 200) {
        const data = JSON.parse(body)

        if (data.users.length !== 0) {
          request({
            url: `https://api.twitch.tv/kraken/users/${data.users[0]._id}/follows/channels/${roomId}`,
            method: 'GET',
            headers: {
              Accept: 'application/vnd.twitchtv.v5+json',
              'Client-ID': config.get('bot.client_id')
            }
          }, (err, res, body) => {
            if (err) return

            const data = JSON.parse(body)

            if (!data.error) {
              client.say(channel, `@${userName}, ${targetUser} подписан на канал ${channel} ${timeFormat(data.created_at)} B)`)
            } else {
              client.say(channel, `@${userName}, ${targetUser} не подписан NotLikeThis`)
            }
          })
        }
      }
    })
  }
}

module.exports = { old }
