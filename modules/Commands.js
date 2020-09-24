const config = require('config')
const path = require('path')
const { checkSettings, timeFormat, declOfNum } = require(path.join(__dirname, 'Utils'))
const client = require(path.join(__dirname, 'client'))
const CommandDB = require(path.join(__dirname, 'CommandDB'))
const VideosDB = require(path.join(__dirname, 'VideosDB'))
const GamesDB = require(path.join(__dirname, 'GamesDB'))
const request = require('request')
const ytInfo = require('youtube-info')
let state = null


const upTime = (channel, roomId) => {
  request({
    url: 'https://api.twitch.tv/kraken/streams/' + roomId,
    method: 'GET',
    headers: {
      Accept: 'application/vnd.twitchtv.v5+json',
      'Client-ID': config.get('bot.client_id')
    }
  }, (err, res, body) => {
    if (err) return

    const data = JSON.parse(body)
    const stream = data.stream
    if (stream) client.say(channel, `Стрим начался ${timeFormat(stream.created_at)} назад`)
    else client.say(channel, 'Стрим оффлайн')
  })
}

const old = (channel, state, args) => {
  const userId = state.user['user-id']
  const roomId = state.user['room-id']
  const userName = state.user.username
  const targetUser = args[0]

  if (!targetUser) {
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
      if (checkBroadcasterPermission()) {
        client.say(channel, `@${userName} ты хочешь узнать подписан ли ты сам на себя? FailFish`)
      } else if (!data.error) {
        client.say(channel, `@${userName} подписан на канал ${channel} ${timeFormat(data.created_at)} B)`)
      } else {
        client.say(channel, `@${userName} ты не подписан NotLikeThis`)
      }
    })
  } else {
    request({
      url: `https://api.twitch.tv/kraken/users?login=${targetUser.replace('@', '')}`,
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
              client.say(channel, `@${userName}, ${targetUser.replace('@', '')} подписан на канал ${channel} ${timeFormat(data.created_at)} B)`)
            } else {
              client.say(channel, `@${userName}, ${targetUser.replace('@', '')} не подписан NotLikeThis`)
            }
          })
        }
      }
    })
  }
}

const timeOutUser = (channel, args) => {
  if (!checkModeratorPermission()) return

  const targetUser = args[0]
  const timeOutDuration = args[1] || 300

  if (!targetUser) return
  if (targetUser.replace('@', '') === channel) return

  client.timeout(channel, targetUser.replace('@', ''), timeOutDuration)
    .then(() => client.say(channel, `@${targetUser.replace('@', '')} ты в муте на ${timeOutDuration} ${declOfNum(timeOutDuration, ['секунду', 'секунды', 'секунд'])} LUL`))
    .catch(err => console.error(err))
}

const banUser = (channel, args) => {
  if (!checkModeratorPermission()) return

  const targetUser = args[0]
  const reason = args[1] || 'Hateful conduct'

  if (!targetUser) return
  if (targetUser.replace('@', '') === channel) return

  client.ban(channel, targetUser.replace('@', ''), reason).catch(err => console.error(err))
}

const unbanUser = (channel, args) => {
  if (!checkModeratorPermission()) return

  const targetUser = args[0]

  if (!targetUser) return
  if (targetUser.replace('@', '') === channel) return

  client.unban(channel, targetUser.replace('@', ''))
    .then(() => client.say(channel, `@${targetUser.replace('@', '')} тебя разбанили, но я слежу за тобой BCWarrior`))
    .catch(err => console.error(err))
}

const pingPong = (channel, userName) => {
  checkSettings(channel, 'pingpong').then(bool => {
    if (bool) client.say(channel, `@${userName} pong`)
  })
}

const cockSize = (channel, state, args) => {
  checkSettings(channel, 'cocksize').then(bool => {
    if (bool) {
      const userName = state.user.username
      const targetUser = args[0]
      const size = Math.floor(Math.random() * (26 - 8)) + 8

      if (!targetUser) {
        if (size > 15) {
          client.say(channel, `@${userName} Вау! ${size} ${declOfNum(size, ['синтиметр', 'сантиметра', 'сантиметров'])} PogChamp`)
        } else {
          client.say(channel, `@${userName} у тебя ${size} ${declOfNum(size, ['синтиметр', 'сантиметра', 'сантиметров'])}. Не расстраивайся LUL`)
        }
      } else {
        if (targetUser.replace('@', '') === channel) return

        if (size > 15) {
          client.say(channel, `У ${targetUser.replace('@', '')} ${size} ${declOfNum(size, ['синтиметр', 'сантиметра', 'сантиметров'])} PogChamp`)
        } else {
          client.say(channel, `У ${targetUser.replace('@', '')} ${size} ${declOfNum(size, ['синтиметр', 'сантиметра', 'сантиметров'])} LUL`)
        }
      }
    }
  })
}

const addVideo = (channel, state, args, io) => {
  checkSettings(channel, 'songrequest').then(bool => {
    if (bool) {
      const checkUrl = (url) => url.match(/^.*((youtu.be\/)|(v\/)|(\/\w\/)|(watch\?))\??v?=?([^#\&\?]*).*/g) != null;
      const youtubeId = (url) => {
        const match = url.match(/^.*((youtu.be\/)|(v\/)|(\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/)
        return (match && match[7].length === 11) ? match[7] : false
      }

      const url = args[0]

      if (!url) return
      if (!checkUrl(url)) return

      const ytId = youtubeId(url)
      if (!ytId) return

      checkSettings(channel, 'songforunsub').then(setting => {
        if (setting) {
          ytInfo(ytId)
            .then(ytData => {
              const vidObj = {
                url,
                channel: channel.toLowerCase(),
                title: ytData.title,
                owner: ytData.owner,
                views: ytData.views,
                duration: ytData.duration,
                thumb: ytData.thumbnailUrl
              }
              VideosDB.create(vidObj)
                .then(data => {
                  io.sockets.emit('new_video', data)
                  client.say(channel, `@${state.user.username} видео добавлено`)
                })
                .catch(error => console.error(error))
            })
            .catch(() => console.error('Video does exist'))
        } else {
          if (state.subscriber || state.mod || state.user.username === channel.toLowerCase()) {
            ytInfo(ytId)
              .then(ytData => {
                const vidObj = {
                  url,
                  channel: channel.toLowerCase(),
                  title: ytData.title,
                  owner: ytData.owner,
                  views: ytData.views,
                  duration: ytData.duration,
                  thumb: ytData.thumbnailUrl
                }
                VideosDB.create(vidObj)
                  .then(data => {
                    io.sockets.emit('new_video', data)
                    client.say(channel, `@${state.user.username} видео добавлено`)
                  })
                  .catch(error => console.error(error))
              })
              .catch(() => console.error('Video does exist'))
          }
        }
      })
    } else client.say(channel, 'Возможность заказывать видео выключена!')
  })
}

const slipVideo = (channel, io) => {
  if (!checkModeratorPermission()) return

  checkSettings(channel, 'songrequest').then(bool => {
    if (bool) io.sockets.emit('skip', { channel: channel.toLowerCase() })
  })
}

const game = (channel, roomId, args) => {
  if (!checkModeratorPermission()) return

  const short = args[0]

  if (!short) return

  checkSettings(channel, 'changegame').then(bool => {
    if (bool) {
      GamesDB.find({ short })
        .then(data => {
          if (!!data.length) {
            setGame(channel, roomId, data[0].game)
          } else {
            setGame(channel, roomId, args.join(' '))
          }
        })
        .catch(err => console.error(err))
    } else client.say(channel, 'Возможность менять категорию стрима командой выключена!')
  })
}

const setGame = (channel, roomId, game) => {
  if (!checkModeratorPermission()) return

  const streamObject = {"channel": { game, "channel_feed_enabled": true }}

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

    client.say(channel, `Установлена категория - ${game}`)
  })
}

const title = (channel, roomId, args) => {
  if (!checkModeratorPermission()) return

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

const poll = (channel, args) => {
  if (!checkModeratorPermission()) return

  checkSettings(channel, 'poll').then(bool => {
    if (bool) {
      if (args.length < 3) return

      const title = args[0]
      args.splice(0, 2)
      const str = args.join(' ')
      const options = str.split(' | ')
      const pollObject = { title, options }

      if (options.length < 2) return client.say(channel, 'Команда введена неверно!')

      request({
        url: 'https://www.strawpoll.me/api/v2/polls',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pollObject)
      }, (err, res, body) => {
        if (err) return

        if (res && res.statusCode === 200) {
          const data = JSON.parse(body)

          client.action(channel, `${title} - Голосовать тут https://www.strawpoll.me/${data.id}`)
        }
      })
    } else client.say(channel, 'Возможность создавать голосования выключена!')
  })
}

const CallCommand = (command, messageInfo, io) => {
  state = messageInfo
  const channel = state.channel.substr(1)

  CommandDB.find()
    .then(data => {
      data.map(i => {
        if (i.tag === command.command && i.channel === channel.toLowerCase()) {
          client.say(channel, i.text)
        }
      })
    })
    .catch(err => console.error(err))

  switch (command.command) {
    case 'time':
    case 'uptime':
    case 'up':
      upTime(channel, state.user['room-id'])
      break
    case 'old':
    case 'oldfag':
    case 'followage':
      old(channel, state, command.args)
      break
    case 'mute':
    case 'timeout':
      timeOutUser(channel, command.args)
      break
    case 'ban':
    case 'permit':
      banUser(channel, command.args)
      break
    case 'unban':
      unbanUser(channel, command.args)
      break
    case 'ping':
      pingPong(channel, state.user.username)
      break
    case 'size':
      cockSize(channel, state, command.args)
      break
    case 'sr':
      addVideo(channel, state, command.args, io)
      break
    case 'skip':
      slipVideo(channel, io)
      break
    case 'game':
      game(channel, state.user['room-id'], command.args)
      break
    case 'title':
      title(channel, state.user['room-id'], command.args)
      break
    case 'poll':
    case 'vote':
      poll(channel, command.args)
      break
    default:
      break
  }
}

const checkBroadcasterPermission = () => state.user.username === state.channel.substr(1)
const checkModeratorPermission = () => state.user.mod || state.user.username === state.channel.substr(1)

module.exports = {
  call: (command, messageInfo, io) => {
    CallCommand(command, messageInfo, io)
  }
}
