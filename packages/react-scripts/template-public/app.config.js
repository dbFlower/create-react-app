const getStyleLoaders = require('./scripts/utils/getStyleLoaders')
const lessRegex = /\.less$/
const lessModuleRegex = /\.module\.less$/
const stylusRegex = /\.styl$/
const stylusModuleRegex = /\.module\.styl$/

module.exports = {
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
    vendor: [
      'react',
      'react-dom',
      'react-router-dom',
      'redux',
      'react-redux',
      'axios'
    ],
  },
  // Merge webpack config strategies.
  // See: https://github.com/survivejs/webpack-merge 
  // merge.strategy({ <field>: '<prepend|append|replace>''})(...configuration | [...configuration])
  mergeStrategies: {
    // 'module.rules': 'prepends' 
  },
  // webpack config here.
  // 
  webpack: {
    module: {
      rules: [
        // add less and stylus support.
        {
          test: lessRegex,
          exclude: lessModuleRegex,
          use: getStyleLoaders({ }, 'less-loader'),
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
        }
      ],
    },
  },

  // You can customize webpack config here.
  injectWebpack: function(webpackConfig, env, paths) {
    console.log(env, paths)
    
    return webpackConfig
  },
}