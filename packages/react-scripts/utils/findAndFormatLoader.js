const { isPlainObject } = require('lodash')

function findAndFormatLoader(rule, loaderPaths) {
  const [ path ] = loaderPaths
  if (loaderPaths.some(path => path === rule.use)) {
    rule.use = [{ loader: path, options: {}, }]

    return rule.use[0]
  }

  // Support loaders passed as first argument.
  // Support CRA confusing usage of Rule.loader (rule.use || rule.loader) both supported now.
  // See: https://github.com/facebook/create-react-app/issues/5736
  const loaders = Array.isArray(rule) ? rule : (rule.use || rule.loader)

  if (Array.isArray(loaders)) {
    const find = loaders.find(loader => loaderPaths.some(path => path === loader || path === loader.loader))

    if (!find) return

    if (typeof find === 'string') {
      const index = loaders.indexOf(find)
      loaders[index] = { loader: path, options: {} }

      return loaders[index]
    }

    if (isPlainObject(find)) {
      find.options = find.options || {}

      return find
    }
  }

  return 
}

module.exports = findAndFormatLoader
