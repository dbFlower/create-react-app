const path = require('path')
const { isFunction, isString } = require('lodash')

function resolveDllConfig(outputConfig = {}, isProd, pathPrefix) {
  const type = isProd ? 'prod' : 'dev'
  const output = {
    filename: isProd ? 'front.[name].[chunkhash:8].dll.js' : '[name].dll.js',
    path: `dll/${isProd ? 'prod' : 'dev'}`,
  }

  const { filename, pathTemplate } = outputConfig

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
