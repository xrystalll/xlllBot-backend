const path = require('path')
const config = require('config')

const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io').listen(server)
const port = process.env.PORT || 7000

const { checkSettings, declOfNum, checkUrl } = require(path.join(__dirname, 'modules', 'Utils'))
const routes = require(path.join(__dirname, 'routes'))

const cors = require('cors')
const session = require('express-session')
const passport = require('passport')
const { OAuth2Strategy } = require('passport-oauth')
const crypto = require('crypto')
const request = require('request')
const hpp = require('hpp')
const helmet = require('helmet')
const xssFilter = require('x-xss-protection')

const Mongoose = require('mongoose')
require(path.join(__dirname, 'modules', 'DB'))
const UserDB = require(path.join(__dirname, 'modules', 'schemas', 'UserDB'))
// const CommandDB = require(path.join(__dirname, 'modules', 'schemas', 'CommandDB'))
const BadWordsDB = require(path.join(__dirname, 'modules', 'schemas', 'BadWordsDB'))
const VideosDB = require(path.join(__dirname, 'modules', 'schemas', 'VideosDB'))
const InvitesDB = require(path.join(__dirname, 'modules', 'schemas', 'InvitesDB'))
const EventsDB = require(path.join(__dirname, 'modules', 'schemas', 'EventsDB'))

const client = require(path.join(__dirname, 'modules', 'client'))
const CommandResolver = require(path.join(__dirname, 'modules', 'CommandResolver'))

client.connect()

client.on('chat', (channel, user, message, self) => {
  if (self) return

  if (message.indexOf('!sr') === -1 && !user.subscriber && !user.mod && user.username !== channel.substr(1).toLowerCase() && checkUrl(message)) {
    checkSettings(channel.substr(1), 'links').then(bool => {
      if (bool) {
        client.deletemessage(channel, user.id).catch(err => console.error(err))
        client.timeout(channel, user.username, '10').catch(err => console.error(err))
      }
    })
  }

  BadWordsDB.find({ channel: channel.substr(1).toLowerCase() })
    .then(data => {
      data.map(i => {
        if (message.includes(i.word)) {
          client.deletemessage(channel, user.id).catch(err => console.error(err))
          client.timeout(channel, user.username, i.duration).catch(err => console.error(err))
        }
      })
    })
    .catch(err => console.error(err))

  if (message.indexOf('@' + config.get('bot.username')) !== -1) {
    client.say(channel, `@${user.username} больше мне не пиши бля от тебя гавной воняет`)
  }

  if (message.indexOf('!') !== -1) {
    CommandResolver.resolve(channel, user, message.replace(/(<([^>]+)>)/ig, ''), io)
  }
})

// триггер команд по таймингу
// let i = 0
// setInterval(() => {
//   CommandDB.find()
//     .then(data => {
//       if (i > data.length - 1) i = 0
//       client.say(data[i].channel, data[i].text)
//       i++
//     })
//     .catch(err => console.error(err))
// }, 60000 * 5)

// подписка
client.on('subscription', (channel, user, method, message, userstate) => {
  const prime = method.prime
  let plan
  switch (method.plan) {
    case '1000': plan = ' 1 уровня'
      break
    case '2000': plan = ' 2 уровня'
      break
    case '3000': plan = ' 3 уровня'
      break
    default:
      break
  }
  const text = `@${user} спасибо за${prime ? ' Twitch Prime' : ''} подписку${plan || ''} Kreygasm`
  const event = `${user} осуществляет подписку${plan || ''}${prime ? ' с помощью Twitch Prime' : ''}`
  checkSettings(channel.substr(1), 'subscription').then(bool => {
    if (bool) client.say(channel, text)
  })
  EventsDB.create({ channel: channel.substr(1).toLowerCase(), text: event, time: Date.now() })
    .then(data => io.sockets.emit('new_event', data))
    .catch(err => console.error(err))
})

// переподписка
client.on('resub', (channel, user, months, message, userstate, method) => {
  let plan
  const cumulativeMonths = userstate['msg-param-cumulative-months']
  switch (method.plan) {
    case '1000': plan = ' 1 уровня'
      break
    case '2000': plan = ' 2 уровня'
      break
    case '3000': plan = ' 3 уровня'
      break
    default:
      break
  }
  if (cumulativeMonths) {
    const text = `@${user} спасибо за ${cumulativeMonths} ${declOfNum(cumulativeMonths, ['месяц', 'месяца', 'месяцев'])} переподписки${plan || ''} Kreygasm`
    const event = `${user} осуществляет переподписку${plan || ''} сроком ${cumulativeMonths} ${declOfNum(cumulativeMonths, ['месяц', 'месяца', 'месяцев'])}`
    checkSettings(channel.substr(1), 'resub').then(bool => {
      if (bool) client.say(channel, text)
    })
    EventsDB.create({ channel: channel.substr(1).toLowerCase(), text: event, time: Date.now() })
      .then(data => io.sockets.emit('new_event', data))
      .catch(err => console.error(err))
  } else {
    const text = `@${user} спасибо за переподписку${plan || ''} Kreygasm`
    const event = `${user} осуществляет переподписку${plan || ''}`
    checkSettings(channel.substr(1), 'resub').then(bool => {
      if (bool) client.say(channel, text)
    })
    EventsDB.create({ channel: channel.substr(1).toLowerCase(), text: event, time: Date.now() })
      .then(data => io.sockets.emit('new_event', data))
      .catch(err => console.error(err))
  }
})

// подарочная подписка
client.on('subgift', (channel, user, streakMonths, recipient, method, userstate) => {
  const recipientUser = userstate['msg-param-recipient-display-name']
  let plan
  switch (method.plan) {
    case '1000': plan = ' 1 уровня'
      break
    case '2000': plan = ' 2 уровня'
      break
    case '3000': plan = ' 3 уровня'
      break
    default:
      break
  }
  const text = `${user} дарит подписку${plan || ''} @${recipientUser} PogChamp`
  const event = `${user} дарит подписку${plan || ''} @${recipientUser}`
  checkSettings(channel.substr(1), 'subgift').then(bool => {
    if (bool) client.say(channel, text)
  })
  EventsDB.create({ channel: channel.substr(1).toLowerCase(), text: event, time: Date.now() })
    .then(data => io.sockets.emit('new_event', data))
    .catch(err => console.error(err))
})

// продление подарочной подписки
client.on('giftpaidupgrade', (channel, user, sender, userstate) => {
  const text = `${user} продлевает подарочную подписку Kreygasm`
  const event = `${user} продлевает подарочную подписку`
  checkSettings(channel.substr(1), 'giftpaidupgrade').then(bool => {
    if (bool) client.say(channel, text)
  })
  EventsDB.create({ channel: channel.substr(1).toLowerCase(), text: event, time: Date.now() })
    .then(data => io.sockets.emit('new_event', data))
    .catch(err => console.error(err))
})

// продление анонимной подарочной подписки
client.on('anongiftpaidupgrade', (channel, user, userstate) => {
  const text = `@${user} спасибо за переподписку Kreygasm`
  const event = `${user} продлевает анонимную подарочную подписку`
  checkSettings(channel.substr(1), 'anongiftpaidupgrade').then(bool => {
    if (bool) client.say(channel, text)
  })
  EventsDB.create({ channel: channel.substr(1).toLowerCase(), text: event, time: Date.now() })
    .then(data => io.sockets.emit('new_event', data))
    .catch(err => console.error(err))
})

// рейд
client.on('raided', (channel, user, viewers) => {
  const text = `twitchRaid ${user} и его ${viewers} ${declOfNum(viewers, ['зритель', 'зрителя', 'зрителей'])} проводят рейд twitchRaid`
  const event = `${user} и его ${viewers} ${declOfNum(viewers, ['зритель', 'зрителя', 'зрителей'])} проводят рейд`
  checkSettings(channel.substr(1), 'raided').then(bool => {
    if (bool) client.say(channel, text)
  })
  EventsDB.create({ channel: channel.substr(1).toLowerCase(), text: event, time: Date.now() })
    .then(data => io.sockets.emit('new_event', data))
    .catch(err => console.error(err))
})

// битсы
client.on('cheer', (channel, userstate, message) => {
  const text = `${userstate['display-name']} Cпасибо за ${userstate.bits} ${declOfNum(userstate.bits, ['битс', 'битса', 'битс'])} TehePelo`
  const event = `${userstate['display-name']} дарит ${userstate.bits} ${declOfNum(userstate.bits, ['битс', 'битса', 'битс'])}`
  checkSettings(channel.substr(1), 'cheer').then(bool => {
    if (bool) client.say(channel, text)
  })
  EventsDB.create({ channel: channel.substr(1).toLowerCase(), text: event, time: Date.now() })
    .then(data => io.sockets.emit('new_event', data))
    .catch(err => console.error(err))
})


app.use(session({
  secret: config.get('auth.session'),
  cookie: { httpOnly: true, sameSite: true },
  resave: false,
  saveUninitialized: false
})),
app.use(passport.initialize()),
app.use(passport.session()),
app.use(hpp()),
app.use(helmet.noSniff()),
app.use(xssFilter()),

app.use(cors()),

// twitch auth
OAuth2Strategy.prototype.userProfile = (accessToken, next) => {
  request({
    url: 'https://api.twitch.tv/helix/users',
    method: 'GET',
    headers: {
      Accept: 'application/vnd.twitchtv.v5+json',
      'Client-ID': config.get('bot.client_id'),
      Authorization: 'Bearer ' + accessToken
    }
  }, (err, res, data) => {
    if (res && res.statusCode === 200) next(null, JSON.parse(data))
    else next(JSON.parse(data))
  })
},

passport.serializeUser((user, next) => {
  next(null, user)
}),

passport.deserializeUser((user, next) => {
  next(null, user)
}),

passport.use('twitch', new OAuth2Strategy({
  authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
  tokenURL: 'https://id.twitch.tv/oauth2/token',
  clientID: config.get('bot.client_id'),
  clientSecret: config.get('auth.secret'),
  callbackURL: config.get('auth.callback_url'),
  state: true
}, (accessToken, refreshToken, profile, next) => {
  const data = profile.data[0]
  const channel = data.login
  profile.accessToken = accessToken
  profile.refreshToken = refreshToken

  if (!channel) next(null, false)

  InvitesDB.findOne({ channel })
    .then(res => {
      if (res && res.channel === data.login) {
        UserDB.findOrCreate({
          twitchId: data.id,
          login: data.login
        })
        next(null, profile)
      } else {
        next(null, false)
      }
    })
    .catch(err => console.error(err))
})),

app.get('/auth/twitch', passport.authenticate('twitch', { scope: 'user_read' })),

app.get('/auth/twitch/callback', passport.authenticate('twitch', { failureRedirect: config.get('clientEndPoint') + '/auth/error' }), (req, res) => {
  if (!req.session.passport) return res.status(401).redirect(config.get('clientEndPoint') + '/auth/error')

  const { id } = req.session.passport.user.data[0]

  if (!id) return res.status(401).redirect(config.get('clientEndPoint') + '/auth/error')

  const hash = crypto.createHash('md5').update(req.session.passport.user.refreshToken + 'is' + req.session.passport.user.data[0].login).digest('hex')
  const logo = req.session.passport.user.data[0].profile_image_url

  UserDB.updateOne({ twitchId: id }, { hash, logo })
    .then(() => {
      UserDB.find({ twitchId: id })
        .then(data => {
          io.sockets.emit('user_data', { login: data[0].login, logo: data[0].logo }),
          res.redirect(config.get('clientEndPoint') + '/auth/?sess=' + hash)
        })
        .catch(error => res.status(401).redirect(config.get('clientEndPoint') + '/auth/error'))
    .catch(error => res.status(401).redirect(config.get('clientEndPoint') + '/auth/error'))
  })
}),

app.use('/', routes),

io.on('connection', (socket) => {
  socket.on('video_items', (data) => {
    const channel = data.channel

    if (!channel) return socket.emit('alert', { message: 'Channel does not exist', type: 'error' })

    VideosDB.find({ channel: channel.toLowerCase() })
      .then(data => socket.emit('output_videos', data))
      .catch(() => socket.emit('alert', { message: 'Failed to output all videos', type: 'error' }))
  }),

  socket.on('delete_video', (data) => {
    const { id, channel } = data

    if (!id && !channel) return socket.emit('alert', { message: 'Channel does not exist', type: 'error' })

    VideosDB.deleteOne({ _id: Mongoose.Types.ObjectId(id), channel: channel.toLowerCase() })
      .then(() => socket.emit('deteted', { id }))
      .catch(() => socket.emit('alert', { message: 'Failed to delete video', type: 'error' }))
  }),

  socket.on('event_items', (data) => {
    const channel = data.channel

    if (!channel) return socket.emit('alert', { message: 'Channel does not exist', type: 'error' })

    EventsDB.find({ channel: channel.toLowerCase() })
      .then(data => socket.emit('output_events', data))
      .catch(() => socket.emit('alert', { message: 'Failed to output all events', type: 'error' }))
  }),

  socket.on('delete_events', (data) => {
    const channel = data.channel

    if (!channel) return socket.emit('alert', { message: 'Channel does not exist', type: 'error' })

    EventsDB.deleteMany({ channel: channel.toLowerCase(), time: { $lt: (Date.now() - 86400 * 1000).toString() } })
      .then(data => socket.emit('events_deleted', { deletedCount: data.deletedCount }))
      .catch(error => socket.emit('alert', { message: 'Failed to output all events', type: 'error' }))
  })
}),

server.listen(port, () => console.log('Server running on port ' + port))
