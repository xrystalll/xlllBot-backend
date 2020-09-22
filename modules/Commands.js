const config = require('config')
const path = require('path')
const { checkSettings, timeFormat, declOfNum } = require(path.join(__dirname, 'Utils'))
const client = require(path.join(__dirname, 'client'))
const CommandDB = require(path.join(__dirname, 'CommandDB'))
const VideosDB = require(path.join(__dirname, 'VideosDB'))
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
    } else client.say(channel, 'Возможность заказывать видео выключена.')
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

  const gameParam = args[0]

  if (!gameParam) return

  let game
  switch (gameParam.toLowerCase()) {
    case 'irl':
    case 'justchatting': game = 'Just Chatting'
    break
    case 'demo': game = 'Games + Demos'
    break
    case 'art': game = 'Art'
    break
    case 'science': game = 'Science & Technology'
    break
    case 'marbles': game = 'Marbles On Stream'
    break
    case 'fortnite': game = 'Fortnite'
    break
    case 'pubg': game = 'PLAYERUNKNOWN\'S BATTLEGROUNDS'
    break
    case 'apex': game = 'Apex Legends'
    break
    case 'overwatch': game = 'Overwatch'
    break
    case 'csgo': game = 'Counter-Strike: Global Offensive'
    break
    case 'valorant': game = 'Valorant'
    break
    case 'lol': game = 'League of Legends'
    break
    case 'dota2': game = 'Dota 2'
    break
    case 'wow': game = 'World of Warcraft'
    break
    case 'hearthstone': game = 'Hearthstone'
    break
    case 'rainbowsix': game = 'Tom Clancy\'s Rainbow Six: Siege'
    break
    case 'rocketleague': game = 'Rocket League'
    break
    case 'minecraft': game = 'Minecraft'
    break
    case 'dbd': game = 'Dead by Daylight'
    break
    case 'gta3': game = 'Grand Theft Auto III'
    break
    case 'gtavc': game = 'Grand Theft Auto: Vice City'
    break
    case 'gtasa': game = 'Grand Theft Auto: San Andreas'
    break
    case 'gta4': game = 'Grand Theft Auto IV'
    break
    case 'gta5': game = 'Grand Theft Auto V'
    break
    case 'tarkov': game = 'Escape From Tarkov'
    break
    case 'rust': game = 'Rust'
    break
    case 'poe': game = 'Path of Exile'
    break
    case 'witcher3': game = 'The Witcher 3: Wild Hunt'
    break
    case 'cyberpunk': game = 'Cyberpunk 2077'
    break
    case 'deadspace3': game = 'Dead Space 3'
    break
    case 'deadspace2': game = 'Dead Space 2'
    break
    case 'deadspace1': game = 'Dead Space'
    break
    case 'deathstranding': game = 'Death Stranding'
    break
    case 'outlast': game = 'Outlast'
    break
    case 'outlast2': game = 'Outlast 2'
    break
    case 'raft': game = 'Raft'
    break
    case 'warface': game = 'Warface'
    break
    case 'dayz': game = 'DayZ'
    break
    case 'seaofthieves': game = 'Sea of Thieves'
    break
    case 'darksouls3': game = 'Dark Souls III'
    break
    case 'rdr2': game = 'Red Dead Redemption 2'
    break
    case 'rdr': game = 'Red Dead Redemption'
    break
    case 'vrchat': game = 'VRChat'
    break
    case 'terraria': game = 'Terraria'
    break
    case 'osu': game = 'osu!'
    break
    case 'sims4': game = 'The Sims 4'
    break
    case 'amongus': game = 'Among Us'
    break
    case 'fallguys': game = 'Fall Guys'
    break
    case 'brawlstars': game = 'Brawl Stars'
    break
    default: game = args.join(' ')
    break
  }

  const streamObject = {"channel": {game, "channel_feed_enabled": true}}

  checkSettings(channel, 'changegame').then(bool => {
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

        client.say(channel, `Установлена категория ${game}`)
      })
    } else client.say(channel, 'Возможность менять категорию стрима командой выключена.')
  })
}

const title = (channel, roomId, args) => {
  if (!checkModeratorPermission()) return

  if (args.length === 0) return

  const title = args.join(' ')
  const streamObject = {"channel": {"status": title, "channel_feed_enabled": true}}

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
    } else client.say(channel, 'Возможность менять название стрима командой выключена.')
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

      if (options.length < 2) return client.say(channel, 'Команда введена неверно')

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

          client.action(channel, `${title} - голосовать тут https://www.strawpoll.me/${data.id}`)
        }
      })
    } else client.say(channel, 'Возможность создавать голосования выключена.')
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
