const webpack = require('webpack')
const merge = require('webpack-merge')
const chalk =  require("chalk")
const fs = require('fs-extra')
const path = require('path')
const TsConfigPathsWebpackPlugin = require('tsconfig-paths-webpack-plugin')
const ExtraWatchWebpackPlugin = require('extra-watch-webpack-plugin')
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin-alt');

const paths = require('../config/paths')
const injectCSS = require('./injectCSS')
const { dll } = require(path.resolve(paths.appPath, 'app.config'))
const resolveDllConfig = require('./resolveDllConfig')


const resolvePath = (_path) => path.resolve(paths.appPath, _path)
const isProd = process.env.NODE_ENV === 'production'
const isDev = process.env.NODE_ENV === 'development'
const useYarn = fs.existsSync(path.join(paths.appPath, 'yarn.lock'))

module.exports = function injectConfig(webpackConfig, config = {}) {
  const { 
    webpack: webpackCfg, 
    env, 
    injectWebpack, 
    cssVariables, 
    mergeStrategies, 
    beforeFileLoader,
    dllPublicPath,
  } = config
  
  // Add polyfill to entry.
  const polyfill = path.join(paths.appPath, 'scripts/polyfill.js')
  
  // Remove ForkTsCheckerWebpackPlugin
  const { plugins } = webpackConfig
  const lastPlugin = plugins.pop()

  if (lastPlugin instanceof ForkTsCheckerWebpackPlugin) {
    console.log(chalk.green('ForkTsCheckerWebpackPlugin was removed by injectConfig.js'))
  } else {
    plugins.push(lastPlugin)
  }

  webpackConfig.plugins = plugins

  webpackConfig = merge.smartStrategy({ entry: 'prepend' })(webpackConfig, {
    entry: [polyfill],
    resolve: {
      plugins: [
        new TsConfigPathsWebpackPlugin({ 
          mainFields: ['main', '']
        })
      ]
    }
  })

  const mergeFn = merge.strategy({ 'module.rules': 'prepend', ...(mergeStrategies || {}) })
  webpackConfig = mergeFn(webpackConfig, webpackCfg || {})

  if (env) {
    // TODO: handle env.
  }

  // Add css Pre-processors here.
  const fileLoaderPath = require.resolve('file-loader')
  const { module: { rules } } = webpackConfig
  // Find oneOf rule first
  const find = rules.find(rule => {
    const { oneOf } = rule
    if (!oneOf) return false
    const lastLoader = oneOf.slice().pop()
    return [fileLoaderPath, 'file-loader'].some(p => p === lastLoader || p === lastLoader.loader)
  })

  // Modify oneOf
  if (find) {
    const { oneOf } = find
    const fileLoader = oneOf.pop()
    oneOf.push(...beforeFileLoader || [])
    oneOf.push(fileLoader)
  }

  // Handle css variable files.
  let cssVarFiles = (cssVariables || []).reduce((all, file) => {
    if (file) all.push(resolvePath(file))

    return all
  }, [])

  if (cssVarFiles.length) {
    injectCSS(webpackConfig, cssVarFiles)
    // Add css variable files hot reload.
    webpackConfig = merge(webpackConfig, {
      plugins: [
        new ExtraWatchWebpackPlugin({
          files: cssVarFiles
        })
      ]
    })
  }
  
  const { output } = dll
  const dllOutput = resolveDllConfig(output, isProd, paths.appPath)
  const dllPath = dllOutput.path
  const files = fs.readdirSync(dllPath)
  const dllJsFiles = []
  const dllPlugins = []

  if (files.length === 0) {
    const cmdBin = useYarn ? 'yarn' : 'npm run'
    const cmd = isProd ? 'dll-prod' : 'dll'

    console.error(chalk.red('No dll files found, please run this command:'))
    console.error(chalk.cyan(`${cmdBin} ${cmd}`))
    throw new Error('')
  }

  files.forEach(file => {
    if (/\.json$/.test(file)) {
      dllPlugins.push(new webpack.DllReferencePlugin({
        manifest: path.join(dllPath, file),
      }))
    }
    if (/\.js$/.test(file)) {
      dllJsFiles.push(file)
    }
  })

  // Add dev only config
  if (isDev) {
    const assetsPlugins = []

    dllJsFiles.forEach(file => {
      assetsPlugins.push(new AddAssetHtmlPlugin({
        filepath: path.join(dllPath, file),
        includeSourcemap: false
      }))
    })

    webpackConfig = merge(webpackConfig, {
      plugins: dllPlugins.concat(assetsPlugins),
    })
  }

  // add prod only config
  if (isProd) {
    const plugins = [
      // 对打包出来的文件做一个分析
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
      })
    ]

    plugins.push(...dllPlugins)

    // 配合html-webpack-plugin使用，动态的把dll文件给塞最后编译出来的文件里头去
    plugins.push(new HtmlWebpackIncludeAssetsPlugin({
      assets: dllJsFiles.map(path => ({ path, type: 'js' })),
      append: false,
      publicPath: dllPublicPath || '',
    }))

    webpackConfig = merge(webpackConfig, {
      plugins,
      optimization: {
        // 做代码分割以后，每一个动态异步组件会将所有非dll的import都给打包进来，因此这里要做一个CommonsChunk
        splitChunks: {
          minChunks: 2,
          // 如果做code split以后，可以确保首次加载的时候不需要加载common chunk，那么可以开启这个
          // 用来在把common chunk也弄上去懒加载
          chunks: "all",
          minSize: 10240,
        }
      }
    })
  }

  return (injectWebpack && injectWebpack(webpackConfig, process.env.NODE_ENV, paths)) || webpackConfig;
}
