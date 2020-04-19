const express = require('express')
const router = express.Router()
const path = require('path')

const Mongoose = require('mongoose')
const UserDB = require(path.join(__dirname, '..', 'modules', 'UserDB'))
const ChannelDB = require(path.join(__dirname, '..', 'modules', 'ChannelDB'))
const CommandDB = require(path.join(__dirname, '..', 'modules', 'CommandDB'))
const BadWordsDB = require(path.join(__dirname, '..', 'modules', 'BadWordsDB'))
const SettingsDB = require(path.join(__dirname, '..', 'modules', 'SettingsDB'))
const EventsDB = require(path.join(__dirname, '..', 'modules', 'EventsDB'))
const VideosDB = require(path.join(__dirname, '..', 'modules', 'VideosDB'))
const InvitesDB = require(path.join(__dirname, '..', 'modules', 'InvitesDB'))

// get user info
router.get('/api/user', (req, res) => {
  const auth = req.get('authorization')

  if (!auth) {
    res.set("WWW-Authenticate", "Basic realm='Authorization Required'")
    return res.status(401).json({ error: 'Need authorization' })
  }

  const credentials = new Buffer.from(auth.split(' ').pop(), 'base64').toString('ascii').split(':')
  const token = credentials[1]

  if (!token) return res.status(401).json({ error: 'Access Denied' })

  UserDB.findOne({ hash: token })
    .then(data => res.json(data))
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
  const token = credentials[1]

  if (!token) return res.status(401).json({ error: 'Access Denied' })

  UserDB.findOne({ hash: token })
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
  const token = credentials[1]

  if (!token) return res.status(401).json({ error: 'Access Denied' })

  UserDB.findOne({ hash: token })
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
  const token = credentials[1]

  if (!token) return res.status(401).json({ error: 'Access Denied' })

  UserDB.findOne({ hash: token })
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
  const token = credentials[1]

  if (!token) return res.status(401).json({ error: 'Access Denied' })

  UserDB.findOne({ hash: token })
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
  const token = credentials[1]

  if (!token) return res.status(401).json({ error: 'Access Denied' })

  UserDB.findOne({ hash: token })
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
  const token = credentials[1]

  if (!token) return res.status(401).json({ error: 'Access Denied' })

  UserDB.findOne({ hash: token })
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
  const token = credentials[1]

  if (!token) return res.status(401).json({ error: 'Access Denied' })

  UserDB.findOne({ hash: token })
    .then(data => {
      const channel = data.login
      const { word, duration } = req.query

      if (isNaN(duration)) return res.status(400).json({ error: 'Duration must be a number' })
      if (!word || !duration || !channel) return res.status(400).json({ error: 'Empty request' })

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
  const token = credentials[1]

  if (!token) return res.status(401).json({ error: 'Access Denied' })

  UserDB.findOne({ hash: token })
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
  const token = credentials[1]

  if (!token) return res.status(401).json({ error: 'Access Denied' })

  UserDB.findOne({ hash: token })
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
  const token = credentials[1]

  if (!token) return res.status(401).json({ error: 'Access Denied' })

  UserDB.findOne({ hash: token })
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