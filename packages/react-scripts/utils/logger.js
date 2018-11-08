const chalk = require('chalk')

const logPrefixName = '@chipcoo/CRA'

function handleWords(words) {
  if (Array.isArray(words)) {
    return words.join('\n')
  }

  return words
}

function logger(words) {
  return console.log(`[${chalk.bold(logPrefixName)}]: ${handleWords(words)}`)
}

logger.info = function(words) {
  return console.info(`[${chalk.bold.blue(logPrefixName)}]: ${handleWords(words)}`)
}

logger.warn = function(words) {
  return console.warn(`[${chalk.bold.yellow(logPrefixName)}]: ${handleWords(words)}`)
}

logger.error = function(words) {
  return console.error(`[${chalk.bold.red(logPrefixName)}]: ${handleWords(words)}`)
}

module.exports = logger
