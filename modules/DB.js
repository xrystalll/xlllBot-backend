const config = require('config')
const path = require('path')

const Mongoose = require('mongoose')
const cachegoose = require('cachegoose')

const ChannelDB = require(path.join(__dirname, 'models', 'ChannelDB'))
 
cachegoose(Mongoose, {
  engine: 'redis',
  port: config.get('redis.port'),
  host: config.get('redis.host')
})

Mongoose.connect(config.get('mongoremote'), { useUnifiedTopology: true, useNewUrlParser: true })
  .then(() => {
    ChannelDB.updateMany({ bot_active: true }, { bot_active: false }, (err) => {
      if (err) console.error('Change bot status error:', err)
    })
    console.log('MongoDB connected.')
  })
  .catch(err => console.error('MongoDB error: ', err))
