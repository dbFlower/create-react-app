const merge = require('webpack-merge')
const paths = require('../../config/paths')
const injectCSS = require('./injectCSS')

module.exports = function injectConfig(webpackConfig, config = {}) {
    const { webpack, env, injectWebpack, cssVariables, mergeStrategies } = config
    const mergeFn = merge.strategy({ 'modules.rules': 'prepend', ...(mergeStrategies || {}) })
    webpackConfig = mergeFn(webpackConfig, webpack || {})

    if (env) {
        // TODO: handle env.
    }

    if (cssVariables) {
        injectCSS(webpackConfig, cssVariables)
    }

    return (injectWebpack && injectWebpack(webpackConfig, process.env.NODE_ENV, paths)) || webpackConfig;
}