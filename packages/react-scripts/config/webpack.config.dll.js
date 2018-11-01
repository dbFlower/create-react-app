const webpack = require('webpack');
const path = require('path');
const paths = require('./paths');
const entry = require('../app.config').dll

let type = process.env.DLL_TYPE;

const dirPath = path.join(paths.appDll, type);

const dllConfig = {
  output: {
    path: dirPath,
    filename: type === 'prod' ? 'front.[name].[chunkhash:8].dll.js' : '[name].dll.js',
    library: `cw_[name]_dll`
  },
  entry,
  plugins: [
    new webpack.DllPlugin({
      path: path.join(dirPath, '[name].manifest.json'),
      // 注意这里需要和上面哪个output里面的library保持一直，不然会报错找不到引用
      name: `cw_[name]_dll`
    })
  ]
};

// 如果是生产，那么打包出来的vendor还需要压缩一下
if (type === 'prod') {
  dllConfig.plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      // 最紧凑的输出
      beautify: false,
      // 删除所有的注释
      comments: false,
      compress: {
        // 在UglifyJs删除没有用到的代码时不输出警告
        warnings: false,
        // 删除所有的console的语句
        drop_console: true,
        // 提取出出现多次但是没有定义成变量去引用的静态值
        reduce_vars: true
      }
    })
  );
}

module.exports = dllConfig;
