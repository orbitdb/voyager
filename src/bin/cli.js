#!/usr/bin/env node

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import daemon from './daemon.js'
import RPC from './rpc-client.js'
import { Responses } from './lib/messages/index.js'

yargs(hideBin(process.argv))
  .scriptName('voyager')
  .command(
    'daemon',
    'Launch Voyager',
    () => {},
    async (argv) => {
      await daemon({ options: argv })
    })
  .command('auth', 'Add/remove authorized addresses', yargs => {
    yargs
      .command(
        'add <id>',
        'Add an authorized address',
        yargs => {
          yargs.positional('id', {
            describe: 'The id of the user who is allowed to pin one or more databases (or denied depending on default access settings).',
            type: 'string'
          })
        },
        async argv => {
          const { authAdd } = await RPC(argv)
          const res = await authAdd(argv)
          if (res.type === Responses.OK) {
            console.log('ok')
            process.exit(0)
          } else {
            console.error(res)
            process.exit(1)
          }
        })
      .command(
        'del <id>',
        'Remove an authorized address',
        yargs => {
          yargs.positional('id', {
            describe: 'The id of the user who will no longer be allowed to pin one or more databases (or denied depending on default access settings).',
            type: 'string'
          })
        },
        async argv => {
          const { authDel } = await RPC(argv)
          const res = await authDel(argv)
          if (res.type === Responses.OK) {
            console.log('ok')
            process.exit(0)
          } else {
            console.error(res)
            process.exit(1)
          }
        })
      .command(
        'list',
        'List authorized addresses',
        () => {},
        async argv => {
          const { authList } = await RPC(argv)
          const res = await authList()
          if (res.type === Responses.OK) {
            for (const id of res.message) {
              console.log(id)
            }
            process.exit(0)
          } else {
            console.error(res)
            process.exit(1)
          }
        })
      .demandCommand(1, 'Error: use add or remove')
  })
  .option('verbose', {
    alias: 'v',
    description: 'Be more verbose. Outputs errors and other connection messages. Use multiple -vvv for more verbose logging.',
    type: 'count'
  })
  .option('directory', {
    alias: 'd',
    type: 'string',
    description: 'Specify a directory to store IPFS and OrbitDB data.'
  }).option('allow', {
    alias: 'a',
    type: 'boolean',
    description: 'Allow anyone to pin a database. The default is false.'
  })
  .demandCommand(1, 'Error: specify a command.')
  .help()
  .parse()