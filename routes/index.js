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

const AuthProtect = (req, res) => new Promise((resolve, reject) => {
  const auth = req.get('authorization')

  if (!auth) {
    res.set("WWW-Authenticate", "Basic realm='Authorization Required'")
    reject(null)
  }

  const credentials = new Buffer.from(auth.split(' ').pop(), 'base64').toString('ascii').split(':')
  const [user, token] = credentials

  if (!token && !user) reject(null)

  return UserDB.findOne({ login: user, hash: token })
    .then(data => resolve(data))
    .catch(error => reject(null))
})

// users api
// get user info
router.get('/api/user', (req, res) => {
  AuthProtect(req, res)
    .then(data => {
      if (!data) throw Error

      res.json(data)
    })
    .catch(error => res.status(401).json({ error: 'Access Denied' }))
}),


// channels api
// get channel data
router.get('/api/channel', (req, res) => {
  AuthProtect(req, res)
    .then(data => {
      if (!data) throw Error

      const channel = data.login

      if (!channel) return res.status(400).json({ error: 'Channel name does not exist' })

      ChannelDB.find({ name: channel })
        .then(data => {
          if (data.length) {
            res.json(data)
          } else {
            ChannelDB.create({ name: channel })
              .then(output => res.json([output]))
              .catch(error => res.status(500).json({ error }))
          }
        })
        .catch(error => res.status(500).json({ error: 'Unable to get channel' }))
    })
    .catch(error => res.status(401).json({ error: 'Access Denied' }))
}),

// get moderators list
router.get('/api/channel/mods', (req, res) => {
  AuthProtect(req, res)
    .then(data => {
      if (!data) throw Error

      const channel = data.login

      if (!channel) return res.status(400).json({ error: 'Channel name does not exist' })

      client.mods(channel)
        .then(data => res.json(data))
        .catch(error => res.status(500).json({ error: 'Unable to get list of moderators' }))
    })
    .catch(error => res.status(401).json({ error: 'Access Denied' }))
}),


// bot
// join bot to chat
router.get('/api/bot/join', (req, res) => {
  AuthProtect(req, res)
    .then(data => {
      if (!data) throw Error

      const channel = data.login

      if (!channel) return res.status(400).json({ error: 'Channel name does not exist' })

      client.join(channel)
        .then(data => {
          ChannelDB.updateOne({ name: channel }, { bot_active: true })
            .then(() => res.json({ message: 'Bot joined to chat: ' + data.join() }))
            .catch(error => res.status(500).json({ error }))
        })
        .catch(error => res.status(500).json({ error: 'Unable join to chat' }))
    })
    .catch(error => res.status(401).json({ error: 'Access Denied' }))
}),

// leave bot from chat
router.get('/api/bot/leave', (req, res) => {
  AuthProtect(req, res)
    .then(data => {
      if (!data) throw Error

      const channel = data.login

      if (!channel) return res.status(400).json({ error: 'Channel name does not exist' })

      client.part(channel)
        .then(data => {
          ChannelDB.updateOne({ name: channel }, { bot_active: false })
            .then(() => res.json({ message: 'Bot left chat: ' + data.join() }))
            .catch(error => res.status(500).json({ error }))
        })
        .catch(error => res.status(500).json({ error: 'Unable to leave from chat' }))
    })
    .catch(error => res.status(401).json({ error: 'Access Denied' }))
}),


// commands api
// get all commands
router.get('/api/commands/all', (req, res) => {
  AuthProtect(req, res)
    .then(data => {
      if (!data) throw Error

      const channel = data.login

      if (!channel) return res.status(400).json({ error: 'Channel name does not exist' })

      CommandDB.find({ channel })
        .then(data => res.json(data))
        .catch(error => res.status(500).json({ error: 'Unable to get list of commands' }))
    })
    .catch(error => res.status(401).json({ error: 'Access Denied' }))
}),

// create new command
router.put('/api/commands/add', (req, res) => {
  AuthProtect(req, res)
    .then(data => {
      if (!data) throw Error

      const channel = data.login
      const { tag, text } = req.body

      if (!channel) return res.status(400).json({ error: 'Channel name does not exist' })
      if (!tag || !text || !channel) return res.status(400).json({ error: 'Empty request' })

      CommandDB.create({ tag, text, channel })
        .then(data => res.json(data))
        .catch(error => res.status(500).json({ error: 'Unable to add command' }))
    })
    .catch(error => res.status(401).json({ error: 'Access Denied' }))
}),

// edit command
router.put('/api/commands/edit', (req, res) => {
  AuthProtect(req, res)
    .then(data => {
      if (!data) throw Error

      const channel = data.login
      const { id, tag, text } = req.body

      if (!channel) return res.status(400).json({ error: 'Channel name does not exist' })
      if (!id || !tag || !text || !channel) return res.status(400).json({ error: 'Empty request' })

      CommandDB.updateOne({ _id: Mongoose.Types.ObjectId(id) }, { tag, text })
        .then(() => res.json({ success: true }))
        .catch(error => res.status(500).json({ error: 'Unable to edit command' }))
    })
    .catch(error => res.status(401).json({ error: 'Access Denied' }))
}),

// delete command
router.put('/api/commands/delete', (req, res) => {
  AuthProtect(req, res)
    .then(data => {
      if (!data) throw Error

      const channel = data.login
      const { id } = req.body

      if (!channel) return res.status(400).json({ error: 'Channel name does not exist' })
      if (!id) return res.status(400).json({ error: 'Empty request' })

      CommandDB.deleteOne({ _id: Mongoose.Types.ObjectId(id), channel })
        .then(data => res.json({ success: true, deletedCount: data.deletedCount }))
        .catch(error => res.status(500).json({ error: 'Unable to delete command' }))
    })
    .catch(error => res.status(401).json({ error: 'Access Denied' }))
}),


// badWords api
router.get('/api/words/all', (req, res) => {
  AuthProtect(req, res)
    .then(data => {
      if (!data) throw Error

      const channel = data.login

      if (!channel) return res.status(400).json({ error: 'Channel name does not exist' })

      BadWordsDB.find({ channel })
        .then(data => res.json(data))
        .catch(error => res.status(500).json({ error: 'Unable to get list of badwords' }))
    })
    .catch(error => res.status(401).json({ error: 'Access Denied' }))
}),

// add new word
router.put('/api/words/add', (req, res) => {
  AuthProtect(req, res)
    .then(data => {
      if (!data) throw Error

      const channel = data.login
      const { word, duration } = req.body

      if (!channel) return res.status(400).json({ error: 'Channel name does not exist' })
      if (!word || !duration || !channel) return res.status(400).json({ error: 'Empty request' })
      if (!Number.isInteger(duration)) return res.status(400).json({ error: 'Duration must be a number' })
      if (duration === 0) return res.status(400).json({ error: 'Duration must be greater then zero' })

      BadWordsDB.create({ word: word.toLowerCase(), duration, channel })
        .then(data => res.json(data))
        .catch(error => res.status(500).json({ error: 'Unable to add badword' }))
    })
    .catch(error => res.status(401).json({ error: 'Access Denied' }))
}),

// delete word
router.put('/api/words/delete', (req, res) => {
  AuthProtect(req, res)
    .then(data => {
      if (!data) throw Error

      const channel = data.login
      const { id } = req.body

      if (!channel) return res.status(400).json({ error: 'Channel name does not exist' })
      if (!id) return res.status(400).json({ error: 'Empty request' })

      BadWordsDB.deleteOne({ _id: Mongoose.Types.ObjectId(id), channel })
        .then(data => res.json({ success: true, deletedCount: data.deletedCount }))
        .catch(error => res.status(500).json({ error: 'Unable to delete badword' }))
    })
    .catch(error => res.status(401).json({ error: 'Access Denied' }))
}),


// settings api
// get all settings
router.get('/api/settings/all', (req, res) => {
  AuthProtect(req, res)
    .then(data => {
      if (!data) throw Error

      const channel = data.login

      if (!channel) return res.status(400).json({ error: 'Channel name does not exist' })

      SettingsDB.find({ channel })
        .then(data => {
          if (data.length) {
            res.json(data)
          } else {
            const defaultSettings = [
              {
                name: 'pingpong',
                state: true,
                description: 'Мини-игра пинг понг',
                channel
              }, {
                name: 'cocksize',
                state: true,
                description: 'Мини-игра "Размер..."',
                channel
              }, {
                name: 'links',
                state: true,
                description: 'Запретить писать ссылки в чат ансабам. Удаление сообщения и таймаут на 10 секунд',
                channel
              }, {
                name: 'songforunsub',
                state: false,
                description: 'Разрешить заказ видео ансабам',
                channel
              }, {
                name: 'songrequest',
                state: true,
                description: 'Заказ видео в чате',
                channel
              }, {
                name: 'changegame',
                state: true,
                description: 'Смена категории стрима командой',
                channel
              }, {
                name: 'changetitle',
                state: true,
                description: 'Смена названия стрима командой',
                channel
              }, {
                name: 'poll',
                state: true,
                description: 'Создание голосования командой',
                channel
              }, {
                name: 'subscription',
                state: true,
                description: 'Уведомлять в чате о новый подписке',
                channel
              }, {
                name: 'resub',
                state: true,
                description: 'Уведомлять в чате о переподписке',
                channel
              }, {
                name: 'subgift',
                state: true,
                description: 'Уведомлять в чате о подарочной подписке',
                channel
              }, {
                name: 'giftpaidupgrade',
                state: true,
                description: 'Уведомлять в чате о продлении подарочной подписки',
                channel
              }, {
                name: 'anongiftpaidupgrade',
                state: true,
                description: 'Уведомлять в чате о продлении анонимной подарочной подписки',
                channel
              }, {
                name: 'raided',
                state: true,
                description: 'Уведомлять в чате о рейде',
                channel
              }, {
                name: 'cheer',
                state: true,
                description: 'Уведомлять в чате о донате битс',
                channel
              }
            ]
            SettingsDB.insertMany(defaultSettings)
              .then(output => res.json(output))
              .catch(error => res.status(500).json({ error }))
          }
        })
        .catch(error => res.status(500).json({ error: 'Unable to get list of settings' }))
    })
    .catch(error => res.status(401).json({ error: 'Access Denied' }))
}),

// toggle setting state
router.put('/api/settings/toggle', (req, res) => {
  AuthProtect(req, res)
    .then(data => {
      if (!data) throw Error

      const channel = data.login
      const { name, state } = req.body

      if (!channel) return res.status(400).json({ error: 'Channel name does not exist' })
      if (!name || state === undefined || !channel) return res.status(400).json({ error: 'Empty request' })
      if (!typeof bool === 'boolean') res.status(400).json({ error: 'State must be boolean' })

      SettingsDB.updateOne({ name, channel }, { state })
        .then(() => res.json({ success: true, state }))
        .catch(error => res.status(500).json({ error: 'Unable to save setting' }))
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
    .catch(error => res.status(500).json({ error: 'Unable to get list of games' }))
}),


// invite api
router.get('/api/invite/add', (req, res) => {
  const { channel } = req.query

  if (!channel) return res.status(400).json({ error: 'Empty request' })

  InvitesDB.findOrCreate({ channel })
    .then(data => res.json(data))
    .catch(error => res.status(500).json({ error: 'Unable to create invite' }))
}),


// error 404
router.get('*', (req, res) => {
  res.status(404).json({ error: '404 Not found' })
})

module.exports = router
