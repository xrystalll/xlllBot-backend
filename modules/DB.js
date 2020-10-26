const config = require('config')
const path = require('path')

const Mongoose = require('mongoose')
const cachegoose = require('cachegoose')

const ChannelsDB = require(path.join(__dirname, 'models', 'ChannelsDB'))
 
cachegoose(Mongoose, {
  engine: 'redis',
  port: config.get('redis.port'),
  host: config.get('redis.host')
})

Mongoose.connect(config.get('mongoremote'), { useUnifiedTopology: true, useNewUrlParser: true })
  .then(() => {
    ChannelsDB.updateMany({ bot_active: true }, { bot_active: false }, (err) => {
      if (err) console.error('Change bot status error:', err)
    })
    console.log('MongoDB connected.')
  })
  .catch(err => console.error('MongoDB error: ', err))
