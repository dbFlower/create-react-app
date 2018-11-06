const webpack = require('webpack');
const merge =require('webpack-merge');
const path = require('path');
const paths = require('./paths');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const { dll } = require(path.resolve(paths.appPath, 'app.config'))
const resolveDllConfig = require('../utils/resolveDllConfig')

const isProd = process.env.NODE_ENV === 'production'
const type = isProd ? 'prod' : 'dev'

const { entry, output } = dll
const dllOutput = resolveDllConfig(output, isProd, paths.appPath)

const dllConfig = {
  mode: isProd ? 'production' : 'development',
  output: {
    ...dllOutput,
    library: `cw_[name]_dll`
  },
  entry,
  plugins: [
    new webpack.DllPlugin({
      path: path.join(dllOutput.path, '[name].manifest.json'),
      // 注意这里需要和上面哪个output里面的library保持一直，不然会报错找不到引用
      name: `cw_[name]_dll`
    })
  ]
};

// 如果是生产环境，将vendor压缩输出。
// See: https://webpack.js.org/configuration/optimization/#src/components/Sidebar/Sidebar.jsx
if (type === 'prod') {
  merge(dllConfig, {
    optimization: {
      minimize: true,
      minimizer: [
        new UglifyJsPlugin({}),        
      ]
    }
  })
}

module.exports = dllConfig;
