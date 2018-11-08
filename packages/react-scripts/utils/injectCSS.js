const merge = require('webpack-merge')
const webpack = require('webpack')
const chalk = require('chalk')
const getLessVariables = require('./getLessVariables')
const findAndFormatLoader = require('./findAndFormatLoader')
const logger = require('./logger')

const lessFiles = ['a.less', 'a.module.less']
const sassFiles = ['a.sass', 'a.scss', 'a.module.sass', 'a.module.scss']

const lessRegex = /\.less$/
const stylRegex = /\.styl$/
const sassRegex = /\.(sass|scss)$/

function showLoaderWarn(loaderName) {
  // Show loader missing warning.
  logger.warn(
    [
      `${chalk.green(loaderName + '-loader')} is missing, but ${chalk.green(loaderName)} file used.`,
      `It may cause some confused problems, please ${chalk.bold('install loader and CSS pre-processor')} manually.`
    ]
  )
}

function showError(loaderName) {
  logger.error(
    [
      `${chalk.green(loaderName + '-loader')} is installed, but ${chalk.bold('can\'t')} find the rule. ${chalk.red('Please report this bug.')}`
    ]
  )
}

function handleLess(rule, list) {
  let loader 
  try {
    const lessLoaderPath = require.resolve('less-loader')
    loader = findAndFormatLoader(rule, [lessLoaderPath, 'less-loader'])
  } catch (e) {
    return showLoaderWarn('less')
  }

  if (!loader) {
    return showError('less')
  }

  const { options } = loader
  options.globalVars = options.globalVars || {}
  list.forEach(file => {
    const variables = getLessVariables(file)
    Object.assign(options.globalVars, variables || {})
  })
}

function handleStylus(webpackConfig, list) {
  try {
    require.resolve('stylus-loader')
  } catch (e) {
    showLoaderWarn('stylus')

    return webpackConfig
  }

  return merge(webpackConfig, {
    plugins: [
      new webpack.LoaderOptionsPlugin({
        test: /\.styl$/,
        stylus: {
          import: list,
        },
      })
    ]
  })
}

function handleSass(rule, list) {
  let loader 
  try {
    const sassLoaderPath = require.resolve('sass-loader')
    loader = findAndFormatLoader(rule, [sassLoaderPath, 'sass-loader'])
  } catch (e) {
    return showLoaderWarn('sass') 
  }

  if (!loader) {
    return showError('sass')
  }

  const { options } = loader
    
  if (options.data) {
    options.data += '\n'
  } else {
    options.data = '' // If no 'data' in options, add it.
  }

  options.data += list.map(file => `@import "${file}";`).join('\n')
}

const testRule = (tests, str) => {
  if (!Array.isArray(tests)) tests = [tests]

  return tests.some(rule => rule.test(str))
}

function loop(rules, { lessList, sassList }) {
  rules.forEach((rule) => {
    if (!rule.test && !rule.oneOf) return false
    if (rule.oneOf) return loop(rule.oneOf, { lessList, sassList })

    if (lessFiles.some(f => testRule(rule.test, f))) {
      // handle less
      lessList.length && handleLess(rule, lessList)
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
    webpackConfig = handleStylus(webpackConfig, stylusList)
  }

  return webpackConfig
}
