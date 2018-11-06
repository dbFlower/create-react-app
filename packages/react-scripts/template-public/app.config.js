const TsImportPluginFactory = require('ts-import-plugin');
const paths = require('@chipcoo/react-scripts/config/paths')
const getStyleLoaders = require('@chipcoo/react-scripts/utils/getStyleLoaders')
const lessRegex = /\.less$/
const lessModuleRegex = /\.module\.less$/
const stylusRegex = /\.styl$/
const stylusModuleRegex = /\.module\.styl$/

// Note: all paths are relative to app roots.
// Note: all paths are relative to app roots.
// Note: all paths are relative to app roots.

module.exports = {
  // Upyun settings here. 
  upyun: false,
  dllPublicPath: '//static.chipcoo.com/front_dll/',
  // CSS global variables or mixin/helpers, hot reload supported. 
  // Auto detect css pre-processors.
  // Note: less only support variables.
  // Stylus & sass can put some helper function here.
  cssVariables: [
    // 'path/to/file'
  ],
  // Vendors.
  // Please run 'npm run dll' manually.
  dll: {
    output: {
      // Note: [type] here isn't a webpack TemplatePaths. it's not a 
      // Support types: 'dev' | 'prod'
      pathTemplate: 'dll/[type]',
      // Function or string.
      // Function example: (isProd) => isProd ? 'prod.dll.js' : 'dev.dll.js'
      filename: (isProd) => isProd ? 'front.[name].[chunkhash:8].dll.js' : '[name].dll.js',
    },
    // Entry config here. 
    entry: {
      vendor: [
        'react',
        'react-dom',
        'react-router-dom',
        'redux',
        'react-redux',
        'axios'
      ],
    },
  },
  beforeFileLoader: [
    {
      test: /\.(ts|tsx)$/,
      include: paths.appSrc,
      use: [
        {
          loader: 'babel-loader'
        },
        {
          loader: require.resolve('ts-loader'),
          options: {
            // disable type checker - we will use it in fork plugin
            transpileOnly: true,
            // load antd and lodash
            getCustomTransformers: () => ({
              before: [
                TsImportPluginFactory([
                  {
                    libraryName: 'antd',
                    libraryDirectory: 'es'
                  },
                  {
                    style: false,
                    libraryName: 'lodash',
                    libraryDirectory: null,
                    camel2DashComponentName: false
                  }
                ])
              ]
            })
          },
        },
      ],
    },
    // add less and stylus support.
    {
      test: lessRegex,
      exclude: lessModuleRegex,
      use: getStyleLoaders({  }, 'less-loader'),
    },
    {
      test: lessModuleRegex,
      exclude: lessRegex,
      use: getStyleLoaders({ module: true }, 'less-loader'),
    },
    {
      test: stylusRegex,
      exclude: stylusModuleRegex,
      use: getStyleLoaders({ }, 'stylus-loader'),
    },
    {
      test: stylusModuleRegex,
      exclude: stylusRegex,
      use: getStyleLoaders({ module: true }, 'stylus-loader'),
    },
  ],
  // Merge webpack config strategies. 
  // See: https://github.com/survivejs/webpack-merge 
  // merge.strategy({ <field>: '<prepend|append|replace>''})(...configuration | [...configuration])
  mergeStrategies: {
    // 'module.rules': 'prepends' 
  },
  // Webpack common config here. 
  webpack: {
    module: {
    },
  },
  // Webpack config for dev only.
  webpackDev: {
    plugins: []
  },
  // Webpack config for prod only.
  webpackProd: {

  },
  // You can customize webpack config here.
  // e.g: customize test config here.
  injectWebpack: function(webpackConfig, env, paths) {
    console.log(env, paths)
    
    return webpackConfig
  },
}
