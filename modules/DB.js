const Mongoose = require('mongoose')
const config = require('config')

Mongoose.connect(config.get('mongoremote'), { useUnifiedTopology: true, useNewUrlParser: true })
  .then(() => console.log('MongoDB connected.'))
  .catch(err => console.error('MongoDB error: ', err))
