const path = require('path')
const { isFunction, isString } = require('lodash')

function resolveDllConfig(config, isProd, pathPrefix) {
  const type = isProd ? 'prod' : 'dev'
  const output = {
    filename: '',
    path: '',
  }

  const { filename, pathTemplate } = config

  if (isString(filename)) {
    output.filename = filename
  }
  if (isFunction(filename)) {
    output.filename = filename(isProd)
  }

  output.path = path.join(pathPrefix, (pathTemplate || '').replace(/\[type\]/g, type))

  return output
}

module.exports = resolveDllConfig
