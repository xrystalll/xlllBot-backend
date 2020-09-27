const express = require('express')
const router = express.Router()
const path = require('path')

const Mongoose = require('mongoose')
const UserDB = require(path.join(__dirname, '..', 'modules', 'models', 'UserDB'))
const ChannelDB = require(path.join(__dirname, '..', 'modules', 'models', 'ChannelDB'))
const CommandDB = require(path.join(__dirname, '..', 'modules', 'models', 'CommandDB'))
const BadWordsDB = require(path.join(__dirname, '..', 'modules', 'models', 'BadWordsDB'))
const SettingsDB = require(path.join(__dirname, '..', 'modules', 'models', 'SettingsDB'))
const EventsDB = require(path.join(__dirname, '..', 'modules', 'models', 'EventsDB'))
const VideosDB = require(path.join(__dirname, '..', 'modules', 'models', 'VideosDB'))
const InvitesDB = require(path.join(__dirname, '..', 'modules', 'models', 'InvitesDB'))
const GamesDB = require(path.join(__dirname, '..', 'modules', 'models', 'GamesDB'))

const client = require(path.join(__dirname, '..', 'modules', 'client'))

// get user info
router.get('/api/user', (req, res) => {
  const auth = req.get('authorization')

  if (!auth) {
    res.set("WWW-Authenticate", "Basic realm='Authorization Required'")
    return res.status(401).json({ error: 'Need authorization' })
  }

  const credentials = new Buffer.from(auth.split(' ').pop(), 'base64').toString('ascii').split(':')
  const [user, token] = credentials

  if (!token && !user) return res.status(401).json({ error: 'Access Denied' })

  UserDB.findOne({ login: user, hash: token })
    .then(data => res.json(data))
    .catch(error => res.status(401).json({ error: 'Access Denied' }))
}),

router.get('/api/user/mods', (req, res) => {
  const auth = req.get('authorization')

  if (!auth) {
    res.set("WWW-Authenticate", "Basic realm='Authorization Required'")
    return res.status(401).json({ error: 'Need authorization' })
  }

  const credentials = new Buffer.from(auth.split(' ').pop(), 'base64').toString('ascii').split(':')
  const [user, token] = credentials

  if (!token && !user) return res.status(401).json({ error: 'Access Denied' })

  UserDB.findOne({ login: user, hash: token })
    .then(data => {
      const channel = data.login

      if (!channel) return res.status(400).json({ error: 'Channel name does not exist' })

      client.mods(channel)
        .then(data => res.json(data))
        .catch(error => res.status(500).json({ error: 'Unable to get list of moderators' }))
    })
    .catch(error => res.status(401).json({ error: 'Access Denied' }))
}),


// channels api
router.get('/api/channel', (req, res) => {
  const auth = req.get('authorization')

  if (!auth) {
    res.set("WWW-Authenticate", "Basic realm='Authorization Required'")
    return res.status(401).json({ error: 'Need authorization' })
  }

  const credentials = new Buffer.from(auth.split(' ').pop(), 'base64').toString('ascii').split(':')
  const [user, token] = credentials

  if (!token && !user) return res.status(401).json({ error: 'Access Denied' })

  UserDB.findOne({ login: user, hash: token })
    .then(data => {
      const channel = data.login

      if (!channel) return res.status(400).json({ error: 'Channel name does not exist' })

      ChannelDB.find({ name: channel.toLowerCase() })
        .then(data => {
          if (data.length) {
            res.json(data)
          } else {
            ChannelDB.create({ name: channel.toLowerCase() })
              .then(output => res.json([output]))
              .catch(error => res.status(500).json({ error }))
          }
        })
        .catch(error => res.status(401).json({ error: 'Access Denied' }))
    })
    .catch(error => res.status(401).json({ error: 'Access Denied' }))
}),

// commands api
router.get('/api/commands/all', (req, res) => {
  const auth = req.get('authorization')

  if (!auth) {
    res.set("WWW-Authenticate", "Basic realm='Authorization Required'")
    return res.status(401).json({ error: 'Need authorization' })
  }

  const credentials = new Buffer.from(auth.split(' ').pop(), 'base64').toString('ascii').split(':')
  const [user, token] = credentials

  if (!token && !user) return res.status(401).json({ error: 'Access Denied' })

  UserDB.findOne({ login: user, hash: token })
    .then(data => {
      const channel = data.login

      if (!channel) return res.status(400).json({ error: 'Channel name does not exist' })

      CommandDB.find({ channel: channel.toLowerCase() })
        .then(data => res.json(data))
        .catch(error => res.status(401).json({ error: 'Access Denied' }))
    })
    .catch(error => res.status(401).json({ error: 'Access Denied' }))
}),

router.get('/api/commands/add', (req, res) => {
  const auth = req.get('authorization')

  if (!auth) {
    res.set("WWW-Authenticate", "Basic realm='Authorization Required'")
    return res.status(401).json({ error: 'Need authorization' })
  }

  const credentials = new Buffer.from(auth.split(' ').pop(), 'base64').toString('ascii').split(':')
  const [user, token] = credentials

  if (!token && !user) return res.status(401).json({ error: 'Access Denied' })

  UserDB.findOne({ login: user, hash: token })
    .then(data => {
      const channel = data.login
      const { tag, text } = req.query

      if (!tag || !text || !channel) return res.status(400).json({ error: 'Empty request' })

      CommandDB.create({ tag, text, channel: channel.toLowerCase() })
        .then(data => res.json(data))
        .catch(error => res.status(500).json({ error }))
    })
    .catch(error => res.status(401).json({ error: 'Access Denied' }))
}),

router.get('/api/commands/edit', (req, res) => {
  const auth = req.get('authorization')

  if (!auth) {
    res.set("WWW-Authenticate", "Basic realm='Authorization Required'")
    return res.status(401).json({ error: 'Need authorization' })
  }

  const credentials = new Buffer.from(auth.split(' ').pop(), 'base64').toString('ascii').split(':')
  const [user, token] = credentials

  if (!token && !user) return res.status(401).json({ error: 'Access Denied' })

  UserDB.findOne({ login: user, hash: token })
    .then(data => {
      const channel = data.login
      const { id, tag, text } = req.query

      if (!id || !tag || !text || !channel) return res.status(400).json({ error: 'Empty request' })

      CommandDB.updateOne({ _id: Mongoose.Types.ObjectId(id) }, { tag, text })
        .then(() => res.json({ success: true }))
        .catch(error => res.status(500).json({ error }))
    })
    .catch(error => res.status(401).json({ error: 'Access Denied' }))
}),

router.get('/api/commands/delete', (req, res) => {
  const auth = req.get('authorization')

  if (!auth) {
    res.set("WWW-Authenticate", "Basic realm='Authorization Required'")
    return res.status(401).json({ error: 'Need authorization' })
  }

  const credentials = new Buffer.from(auth.split(' ').pop(), 'base64').toString('ascii').split(':')
  const [user, token] = credentials

  if (!token && !user) return res.status(401).json({ error: 'Access Denied' })

  UserDB.findOne({ login: user, hash: token })
    .then(data => {
      const channel = data.login
      const { id } = req.query

      if (!id) return res.status(400).json({ error: 'Empty request' })
      if (!channel) return res.status(400).json({ error: 'Channel name does not exist' })

      CommandDB.deleteOne({ _id: Mongoose.Types.ObjectId(id), channel: channel.toLowerCase() })
        .then(data => res.json({ success: true, deletedCount: data.deletedCount }))
        .catch(error => res.status(500).json({ error }))
    })
    .catch(error => res.status(401).json({ error: 'Access Denied' }))
}),


// badWords api
router.get('/api/words/all', (req, res) => {
  const auth = req.get('authorization')

  if (!auth) {
    res.set("WWW-Authenticate", "Basic realm='Authorization Required'")
    return res.status(401).json({ error: 'Need authorization' })
  }

  const credentials = new Buffer.from(auth.split(' ').pop(), 'base64').toString('ascii').split(':')
  const [user, token] = credentials

  if (!token && !user) return res.status(401).json({ error: 'Access Denied' })

  UserDB.findOne({ login: user, hash: token })
    .then(data => {
      const channel = data.login

      if (!channel) return res.status(400).json({ error: 'Channel name does not exist' })

      BadWordsDB.find({ channel: channel.toLowerCase() })
        .then(data => res.json(data))
        .catch(error => res.status(401).json({ error: 'Access Denied' }))
    })
    .catch(error => res.status(401).json({ error: 'Access Denied' }))
}),

router.get('/api/words/add', (req, res) => {
  const auth = req.get('authorization')

  if (!auth) {
    res.set("WWW-Authenticate", "Basic realm='Authorization Required'")
    return res.status(401).json({ error: 'Need authorization' })
  }

  const credentials = new Buffer.from(auth.split(' ').pop(), 'base64').toString('ascii').split(':')
  const [user, token] = credentials

  if (!token && !user) return res.status(401).json({ error: 'Access Denied' })

  UserDB.findOne({ login: user, hash: token })
    .then(data => {
      const channel = data.login
      const { word, duration } = req.query

      if (isNaN(duration)) return res.status(400).json({ error: 'Duration must be a number' })
      if (!word || !duration || !channel) return res.status(400).json({ error: 'Empty request' })
      if (Number(duration) === 0) return res.status(400).json({ error: 'Duration must be greater then zero' })

      BadWordsDB.create({ word: word.toLowerCase(), duration, channel: channel.toLowerCase() })
        .then(data => res.json(data))
        .catch(error => res.status(500).json({ error }))
    })
    .catch(error => res.status(401).json({ error: 'Access Denied' }))
}),

router.get('/api/words/delete', (req, res) => {
  const auth = req.get('authorization')

  if (!auth) {
    res.set("WWW-Authenticate", "Basic realm='Authorization Required'")
    return res.status(401).json({ error: 'Need authorization' })
  }

  const credentials = new Buffer.from(auth.split(' ').pop(), 'base64').toString('ascii').split(':')
  const [user, token] = credentials

  if (!token && !user) return res.status(401).json({ error: 'Access Denied' })

  UserDB.findOne({ login: user, hash: token })
    .then(data => {
      const channel = data.login
      const { id } = req.query

      if (!id) return res.status(400).json({ error: 'Empty request' })
      if (!channel) return res.status(400).json({ error: 'Channel name does not exist' })

      BadWordsDB.deleteOne({ _id: Mongoose.Types.ObjectId(id), channel: channel.toLowerCase() })
        .then(data => res.json({ success: true, deletedCount: data.deletedCount }))
        .catch(error => res.status(500).json({ error }))
    })
    .catch(error => res.status(401).json({ error: 'Access Denied' }))
}),


// settings api
router.get('/api/settings/all', (req, res) => {
  const auth = req.get('authorization')

  if (!auth) {
    res.set("WWW-Authenticate", "Basic realm='Authorization Required'")
    return res.status(401).json({ error: 'Need authorization' })
  }

  const credentials = new Buffer.from(auth.split(' ').pop(), 'base64').toString('ascii').split(':')
  const [user, token] = credentials

  if (!token && !user) return res.status(401).json({ error: 'Access Denied' })

  UserDB.findOne({ login: user, hash: token })
    .then(data => {
      const channel = data.login

      if (!channel) return res.status(400).json({ error: 'Channel name does not exist' })

      SettingsDB.find({ channel: channel.toLowerCase() })
        .then(data => {
          if (data.length) {
            res.json(data)
          } else {
            const defaultSettings = [
              {
                name: 'pingpong',
                state: true,
                description: 'Мини-игра пинг понг',
                channel: channel.toLowerCase()
              }, {
                name: 'cocksize',
                state: true,
                description: 'Мини-игра "Размер..."',
                channel: channel.toLowerCase()
              }, {
                name: 'links',
                state: true,
                description: 'Запретить писать ссылки в чат ансабам. Удаление сообщения и таймаут на 10 секунд',
                channel: channel.toLowerCase()
              }, {
                name: 'songforunsub',
                state: false,
                description: 'Разрешить заказ видео ансабам',
                channel: channel.toLowerCase()
              }, {
                name: 'songrequest',
                state: true,
                description: 'Заказ видео в чате',
                channel: channel.toLowerCase()
              }, {
                name: 'changegame',
                state: true,
                description: 'Смена категории стрима командой',
                channel: channel.toLowerCase()
              }, {
                name: 'changetitle',
                state: true,
                description: 'Смена названия стрима командой',
                channel: channel.toLowerCase()
              }, {
                name: 'poll',
                state: true,
                description: 'Создание голосования командой',
                channel: channel.toLowerCase()
              }, {
                name: 'subscription',
                state: true,
                description: 'Уведомлять в чате о новый подписке',
                channel: channel.toLowerCase()
              }, {
                name: 'resub',
                state: true,
                description: 'Уведомлять в чате о переподписке',
                channel: channel.toLowerCase()
              }, {
                name: 'subgift',
                state: true,
                description: 'Уведомлять в чате о подарочной подписке',
                channel: channel.toLowerCase()
              }, {
                name: 'giftpaidupgrade',
                state: true,
                description: 'Уведомлять в чате о продлении подарочной подписки',
                channel: channel.toLowerCase()
              }, {
                name: 'anongiftpaidupgrade',
                state: true,
                description: 'Уведомлять в чате о продлении анонимной подарочной подписки',
                channel: channel.toLowerCase()
              }, {
                name: 'raided',
                state: true,
                description: 'Уведомлять в чате о рейде',
                channel: channel.toLowerCase()
              }, {
                name: 'cheer',
                state: true,
                description: 'Уведомлять в чате о донате битс',
                channel: channel.toLowerCase()
              }
            ]
            SettingsDB.insertMany(defaultSettings)
              .then(output => res.json(output))
              .catch(error => res.status(500).json({ error }))
          }
        })
        .catch(error => res.status(401).json({ error: 'Access Denied' }))
    })
    .catch(error => res.status(401).json({ error: 'Access Denied' }))
}),

router.get('/api/settings', (req, res) => {
  const auth = req.get('authorization')

  if (!auth) {
    res.set("WWW-Authenticate", "Basic realm='Authorization Required'")
    return res.status(401).json({ error: 'Need authorization' })
  }

  const credentials = new Buffer.from(auth.split(' ').pop(), 'base64').toString('ascii').split(':')
  const [user, token] = credentials

  if (!token && !user) return res.status(401).json({ error: 'Access Denied' })

  UserDB.findOne({ login: user, hash: token })
    .then(data => {
      const channel = data.login
      const { name, state } = req.query

      if (!name || !state || !channel) return res.status(400).json({ error: 'Empty request' })

      SettingsDB.find({ name })
        .then(data => {
          if (data.length) {
            SettingsDB.updateOne({ name, channel: channel.toLowerCase() }, { state })
              .then(() => res.json({ success: true }))
              .catch(error => res.status(500).json({ error }))
          } else res.status(400).json({ error: 'Setting does not exist' })
        })
        .catch(error => res.status(401).json({ error: 'Access Denied' }))
    })
    .catch(error => res.status(401).json({ error: 'Access Denied' }))
}),


// games api
router.get('/api/games', (req, res) => {
  GamesDB.find()
    .then(data => {
      if (data.length) {
        res.json(data)
      } else {
        const defaultGames = [
          {
            game: 'Just Chatting',
            short: 'jc'
          }, {
            game: 'Games + Demos',
            short: 'demo'
          }, {
            game: 'Art',
            short: 'art'
          }, {
            game: 'Science & Technology',
            short: 'science'
          }, {
            game: 'Marbles On Stream',
            short: 'marbles'
          }, {
            game: 'Fortnite',
            short: 'fortnite'
          }, {
            game: 'PLAYERUNKNOWN\'S BATTLEGROUNDS',
            short: 'pubg'
          }, {
            game: 'Apex Legends',
            short: 'apex'
          }, {
            game: 'Overwatch',
            short: 'overwatch'
          }, {
            game: 'Counter-Strike: Global Offensive',
            short: 'csgo'
          }, {
            game: 'Valorant',
            short: 'valorant'
          }, {
            game: 'League of Legends',
            short: 'lol'
          }, {
            game: 'Dota 2',
            short: 'dota2'
          }, {
            game: 'World of Warcraft',
            short: 'wow'
          }, {
            game: 'Hearthstone',
            short: 'hearthstone'
          }, {
            game: 'Tom Clancy\'s Rainbow Six: Siege',
            short: 'rainbowsix'
          }, {
            game: 'Rocket League',
            short: 'rocketleague'
          }, {
            game: 'Minecraft',
            short: 'minecraft'
          }, {
            game: 'Dead by Daylight',
            short: 'dbd'
          }, {
            game: 'Grand Theft Auto III',
            short: 'gta3'
          }, {
            game: 'Grand Theft Auto: Vice City',
            short: 'gtavc'
          }, {
            game: 'Grand Theft Auto: San Andreas',
            short: 'gtasa'
          }, {
            game: 'Grand Theft Auto IV',
            short: 'gta4'
          }, {
            game: 'Grand Theft Auto V',
            short: 'gta5'
          }, {
            game: 'Escape From Tarkov',
            short: 'tarkov'
          }, {
            game: 'Rust',
            short: 'rust'
          }, {
            game: 'Path of Exile',
            short: 'poe'
          }, {
            game: 'The Witcher 3: Wild Hunt',
            short: 'witcher3'
          }, {
            game: 'Cyberpunk 2077',
            short: 'cyberpunk'
          }, {
            game: 'Dead Space 3',
            short: 'deadspace3'
          }, {
            game: 'Dead Space 2',
            short: 'deadspace2'
          }, {
            game: 'Dead Space',
            short: 'deadspace'
          }, {
            game: 'Death Stranding',
            short: 'deathstranding'
          }, {
            game: 'Outlast',
            short: 'outlast'
          }, {
            game: 'Outlast 2',
            short: 'outlast2'
          }, {
            game: 'Raft',
            short: 'raft'
          }, {
            game: 'Warface',
            short: 'warface'
          }, {
            game: 'DayZ',
            short: 'dayz'
          }, {
            game: 'Sea of Thieves',
            short: 'seaofthieves'
          }, {
            game: 'Dark Souls III',
            short: 'darksouls3'
          }, {
            game: 'Red Dead Redemption',
            short: 'rdr'
          }, {
            game: 'Red Dead Redemption 2',
            short: 'rdr2'
          }, {
            game: 'VRChat',
            short: 'vrchat'
          }, {
            game: 'Terraria',
            short: 'terraria'
          }, {
            game: 'osu!',
            short: 'osu'
          }, {
            game: 'The Sims 4',
            short: 'sims4'
          }, {
            game: 'Among Us',
            short: 'amongus'
          }, {
            game: 'Fall Guys',
            short: 'fallguys'
          }, {
            game: 'Brawl Stars',
            short: 'brawlstars'
          }
        ]
        GamesDB.insertMany(defaultGames)
          .then(output => res.json(output))
          .catch(error => res.status(500).json({ error }))
      }
    })
    .catch(error => res.status(500).json({ error }))
}),


router.get('/api/invite/add', (req, res) => {
  const { channel } = req.query

  if (!channel) return res.status(400).json({ error: 'Empty request' })

  InvitesDB.findOrCreate({ channel: channel.toLowerCase() })
    .then(data => res.json(data))
    .catch(error => res.status(500).json({ error }))
}),

router.get('*', (req, res) => {
  res.status(404).json({ error: '404 Not found' })
})

module.exports = router
