const path = require('path')
const { declOfNum } = require(path.join(__dirname, '..', 'Utils'))
const client = require(path.join(__dirname, '..', 'client'))

const timeOutUser = (channel, args) => {
  const targetUser = args[0]
  const timeOutDuration = args[1] || 300

  if (!targetUser) return
  if (targetUser.replace('@', '') === channel) return

  client.timeout(channel, targetUser.replace('@', ''), timeOutDuration)
    .then(() => client.say(channel, `@${targetUser.replace('@', '')} ты в муте на ${timeOutDuration} ${declOfNum(timeOutDuration, ['секунду', 'секунды', 'секунд'])} LUL`))
    .catch(err => console.error(err))
}

const banUser = (channel, args) => {
  const targetUser = args[0]
  const reason = args[1] || 'Hateful conduct'

  if (!targetUser) return
  if (targetUser.replace('@', '') === channel) return

  client.ban(channel, targetUser.replace('@', ''), reason).catch(err => console.error(err))
}

const unbanUser = (channel, args) => {
  const targetUser = args[0]

  if (!targetUser) return
  if (targetUser.replace('@', '') === channel) return

  client.unban(channel, targetUser.replace('@', ''))
    .then(() => client.say(channel, `@${targetUser.replace('@', '')} тебя разбанили, но я слежу за тобой BCWarrior`))
    .catch(err => console.error(err))
}

module.exports = { timeOutUser, banUser, unbanUser }
