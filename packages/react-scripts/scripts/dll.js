/**
 * Copyright (c) 2018-present, Chipwing, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict'

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production'
}

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err
})

const path = require('path')
const chalk = require('chalk')
const fs = require('fs-extra')
const webpack = require('webpack')
const bfj = require('bfj')
const paths = require('../config/paths')

const config = require('../config/webpack.config.dll')

const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles')
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages')
const printHostingInstructions = require('react-dev-utils/printHostingInstructions')
const FileSizeReporter = require('react-dev-utils/FileSizeReporter')
const printBuildError = require('react-dev-utils/printBuildError')
const { checkBrowsers } = require('react-dev-utils/browsersHelper')
const useYarn = fs.existsSync(paths.yarnLockFile)

// These sizes are pretty large. We'll warn for bundles exceeding them.
const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024

const isInteractive = process.stdout.isTTY

const { printFileSizesAfterBuild, measureFileSizesBeforeBuild } = FileSizeReporter 

// Process CLI arguments
const argv = process.argv.slice(2)
const writeStatsJson = argv.indexOf('--stats') !== -1
const dllPath = config.output.path

checkBrowsers(paths.appPath, isInteractive)
  .then(() => {
    return measureFileSizesBeforeBuild(dllPath)
  })
  .then(previousSize => {
    fs.emptyDirSync(dllPath)

    return createDll(previousSize)
  })
  .then(({ stats, previousSize, warnings }) => {
    if (warnings.length) {
      console.log(chalk.yellow('Generated dll with warnings.\n'))
      console.log(warnings.join('\n\n'))
      console.log(
        '\nSearch for the ' +
          chalk.underline(chalk.yellow('keywords')) +
          ' to learn more about each warning.'
      )
      console.log(
        'To ignore, add ' +
          chalk.cyan('// eslint-disable-next-line') +
          ' to the line before.\n'
      )
    } else {
      console.log(chalk.green('Generated successfully.\n'))
    }
    
    console.log('File sizes after gzip:\n')
    console.log(config.output)

    printFileSizesAfterBuild(
      stats,
      previousSize,
      dllPath,
      WARN_AFTER_BUNDLE_GZIP_SIZE,
      WARN_AFTER_CHUNK_GZIP_SIZE
    )
  })
  .catch(err => {
    if (err && err.message) {
      console.log(err.message)
    }
    process.exit(1)
  })

function createDll(previousSize) {
  console.log('Building dll now...')

  let compiler = webpack(config)

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      let messages
      if (err) {
        if (!err.message) {
          return reject(err)
        }

        messages = formatWebpackMessages({
          errors: [err.message],
          warnings: [],
        })
      } else {
        messages = formatWebpackMessages(
          stats.toJson({ all: false, warnings: true, errors: true })
        )
      }

      if (messages.errors.length) {
        // Only keep the first error. Others are often indicative
        // of the same problem, but confuse the reader with noise.
        if (messages.errors.length > 1) {
          messages.errors.length = 1
        }

        return reject(new Error(messages.errors.join('\n\n')))
      }

      const resolveArgs = {
        stats,
        warnings: messages.warnings,
        previousSize,
      }

      if (writeStatsJson) {
        // TODO: write json to correct path.
        return bfj.write(paths.appPath + '/dll-stats.json', stats.toJson())
          .then(() => resolve(resolveArgs))
          .catch((error) => reject(new Error(error)))
      }

      return resolve(resolveArgs)
    })
  })
}
