#!/usr/bin/env node

import Promise = require('any-promise')
import { install, installDependencyRaw, Emitter } from 'typings-core'
import { archifyDependencyTree, logInfo } from './support/cli'

export function help () {
  console.log(`
typings install (with no arguments, in package directory)
typings install <name>=<location>
  <name>        Target module name
  <location>    file|github|npm etc. (see below)
typings install [<source>!]<pkg>[@<version>]
  <source>      npm|registry
typings install file:<path>
  <path>        Path points to either '.d.ts' or 'typings.json'
typings install github:<github username>/<github project>[/<path>][#<commit>]
typings install bitbucket:<bitbucket username>/<bitbucket project>[/<path>][#<commit>]
typings install npm:<package>
typings install bower:<package>
typings install <https?://path>

Aliases: i, in
Options:
  [--name] <name> Target module name
  [-S|--save]     Save as dependency
  [-D|--save-dev] Save as devDependency
  [-P|-save-peer] Save as peerDependency
  [-A|--ambient]  Install as ambient module
    [-SA]         Save as ambientDependency
    [-DA]         Save as ambientDevDependency
  [--production]  Install only production dependencies
                  i.e. skip all dev dependencies
`)
}

export interface Options {
  cwd: string
  verbose: boolean
  save: boolean
  saveDev: boolean
  savePeer: boolean
  ambient: boolean
  emitter: Emitter
}

export function exec (args: string[], options: Options): Promise<void> {
  const { emitter } = options

  if (args.length === 0) {
    return install(options)
      .then(({ tree }) => {
        console.log(archifyDependencyTree(tree, options))
      })
  }

  // Keep track of emitted references.
  const references: string[] = []

  // Log messages on stripped references.
  emitter.on('reference', function ({ reference, name }) {
    if (references.indexOf(reference) === -1) {
      logInfo(`Stripped reference "${reference}" during installation of "${name}"`, 'reference')

      references.push(reference)
    }
  })

  return Promise.all(args.map(arg => {
    return installDependencyRaw(arg, options)
  }))
    .then(results => {
      for (const result of results) {
        console.log(archifyDependencyTree(result.tree, options))
      }
    })
}
