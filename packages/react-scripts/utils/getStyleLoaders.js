const chalk = require('chalk')
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const paths = require('../config/paths')

const resolvePath = (loader) => {
  try {
    return require.resolve(loader)
  } catch (e) {
    // console.error(`[${loader}]: please install ${chalk.green(loader)} first.`)
    return loader
  }
}

// Webpack uses `publicPath` to determine where the app is being served from.
// It requires a trailing slash, or the file assets will get an incorrect path.
const publicPath = paths.servedPath;
// Some apps do not use client-side routing with pushState.
// For these, "homepage" can be set to "." to enable relative asset paths.
const shouldUseRelativeAssetPaths = publicPath === './';

const isProd = process.env.NODE_ENV === 'production'
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false';
const useSourceMap = !isProd || shouldUseSourceMap

const getStyleLoaders = (cssOptions = {}, preProcessor, sourceMap = useSourceMap) => {
  const options = {}
  let secondLoader = {
    loader: require.resolve('css-loader'),
    options: {
      importLoaders: 2,
      ...cssOptions,
    }
  }
  if (cssOptions.modules) {
    Object.assign(options, {
      namedExport: true,
      camelCase: true,
    })

    secondLoader = {
      loader: require.resolve('typings-for-css-modules-loader'),
      options: {
        importLoaders: 2,
        ...options,
        ...cssOptions,
      },
    }
  }
  const loaders = [
    require.resolve('style-loader'),
    secondLoader,
    {
      // Options for PostCSS as we reference these options twice
      // Adds vendor prefixing based on your specified browser support in
      // package.json
      loader: require.resolve('postcss-loader'),
      options: {
        // Necessary for external CSS imports to work
        // https://github.com/facebook/create-react-app/issues/2677
        ident: 'postcss',
        plugins: () => [
          require('postcss-flexbugs-fixes'),
          require('postcss-preset-env')({
            autoprefixer: {
              flexbox: 'no-2009',
              browsers: [
                  '>1%',
                  'last 4 versions',
                  'Firefox ESR',
                  'not ie < 9', // React doesn't support IE8 anyway
              ],
            },
            stage: 3,
          }),
        ],
        sourceMap,
      },
    },
  ];
  if (preProcessor) {
    loaders.push({
      loader: resolvePath(preProcessor),
      options: {
        sourceMap,
      }
    });
  }

  if (isProd) {
    loaders[0] = {
      loader: MiniCssExtractPlugin.loader,
      options: Object.assign(
        {},
        shouldUseRelativeAssetPaths ? { publicPath: '../../' } : undefined
      ),
    }
  }
  
  return loaders;
};

module.exports = getStyleLoaders;
