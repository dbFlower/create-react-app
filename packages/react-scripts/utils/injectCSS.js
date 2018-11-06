const path = require('path')
const getLessVariables = require('./getLessVariables')
const { isPlainObject } = require('lodash')
const merge = require('webpack-merge')
const webpack = require('webpack')

const lessFiles = ['a.less', 'a.module.less']
const stylusFiles = ['a.stylus', 'a.module.stylus']
const sassFiles = ['a.sass', 'a.scss', 'a.module.sass', 'a.module.scss']

const lessRegex = /\.less$/
const stylRegex = /\.styl$/
const sassRegex = /\.(sass|scss)$/

function warn(loaderName) {
  console.warn(`[Inject CSS]: No ${loaderName}-loader find, please report this bug`)
}

function findAndFormatLoader(rule, paths) {
  const [ path ] = paths
  if (paths.some(path => path === rule.use)) {
    rule.use = [{ loader: path, options: {}, }]

    return rule.use[0]
  }

  if (Array.isArray(rule.use)) {
    const find = rule.use.find(loader => paths.some(path => path === loader || path === loader.loader))

    if (!find) return

    if (typeof find === 'string') {
      const index = rule.use.indexOf(find)
      rule.use[index] = { loader: path, options: {} }

      return rule.use[index]
    }

    if (isPlainObject(find)) {
      find.options = find.options || {}

      return find
    }
  }

  return 
}

function handleLess(rule, list) {
  const lessLoaderPath = require.resolve('less-loader')
  const loader = findAndFormatLoader(rule, [lessLoaderPath, 'less-loader'])

  if (!loader) {
    return warn('less')
  }

  const { options } = loader
  options.globalVars = options.globalVars || {}
  list.forEach(file => {
    const variables = getLessVariables(file)
    Object.assign(options.globalVars, variables || {})
  })
}

function handleStylus(rule, list) {
  const stylusLoaderPath = require.resolve('stylus-loader')
  const loader = findAndFormatLoader(rule, [stylusLoaderPath, 'stylus-loader'])
  
  if (!loader) {
    return warn('stylus') 
  }

  const { options } = loader
  options.import = options.import || []
  options.import.push(...list)
}

function handleSass(rule, list) {
  const sassLoaderPath = require.resolve('sass-loader')
  const loader = findAndFormatLoader(rule, [sassLoaderPath, 'sass-loader'])

  if (!loader) {
    return warn('sass') 
  }

  const { options } = loader
    
  if (options.data) {
    options.data += '\n'
  } else {
    options.data = '' // If no 'data' in options, add it.
  }

  options.data += list.map(file => `@import "${file}";`).join('\n')
}

const testRule = (regs, str) => {
  if (!Array.isArray(regs)) regs = [regs]

  return regs.some(rule => rule.test(str))
}

function loop(rules, { lessList, stylusList, sassList }) {
  rules.forEach((rule, i) => {
    if (!rule.test && !rule.oneOf) return false
    if (rule.oneOf) return loop(rule.oneOf, { lessList, stylusList, sassList })

    if (lessFiles.some(f => testRule(rule.test, f))) {
      // handle less
      lessList.length && handleLess(rule, lessList)
      return 
    }

    if (stylusFiles.some(f => testRule(rule.test, f))) {
      // handle stylus 
      stylusList.length && handleStylus(rule, stylusList)
      return
    }

    if (sassFiles.some(f => testRule(rule.test, f))) {
      // handle sass
      sassList.length && handleSass(rule, sassList)
      return 
    }
  })
}

module.exports = function injectCSS(webpackConfig, cssVariables) {
  if (!cssVariables) return webpackConfig 
  
  if (!Array.isArray(cssVariables)) cssVariables = [cssVariables]

  const { module: { rules } } = webpackConfig
  const stylusList = []
  const lessList = []
  const sassList = []

  // Push files to specific list.
  ;cssVariables.filter(f => f).forEach(file => {
    if (stylRegex.test(file)) stylusList.push(file)
    if (lessRegex.test(file)) lessList.push(file)
    if (sassRegex.test(file)) sassList.push(file)
  })

  // If empty list, do nothing.
  if ([stylusList, lessList, sassList].every(list => list.length === 0)) return webpackConfig

  // Find loaders in webpack then modify loader options.
  loop(rules, { lessList, sassList })

  if (stylusList.length) {
    webpackConfig = merge(webpackConfig, {
      plugins: [
        new webpack.LoaderOptionsPlugin({
          options: {
            stylus: {
              import: stylusList
            }
          }
        })
      ]
    })
  }

  return webpackConfig
}
