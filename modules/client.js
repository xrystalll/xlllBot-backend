const tmi = require ('tmi.js')
const path = require('path')
const config = require(path.join(__dirname, 'config'))
const client = new tmi.client(config)

module.exports = client
