const path = require('path')
const Commands = require(path.join(__dirname, 'Commands'))

const CommandResolver = (channel, user, message, io) => {
  const command = recognizeCommand(message)

  if (!command) return

  Commands.call(command, { channel, user, message }, io)
}

const recognizeCommand = (message) => {
  const regex = /!(.*?)$/gm
  const fullCommand = regex.exec(message)

  if (fullCommand) {
    const splittedCommand = fullCommand[1].split(' ')
    const command = splittedCommand[0]

    splittedCommand.shift()

    return {
      command,
      args: splittedCommand
    }
  }

  return false
}

module.exports = {
  resolve: (channel, user, message, io) => {
    CommandResolver(channel, user, message, io)
  }
}
