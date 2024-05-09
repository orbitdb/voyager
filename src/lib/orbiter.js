import { pipe } from 'it-pipe'
import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { createOrbitDB, Identities, KeyStore, KeyValueIndexed } from '@orbitdb/core'
import { LevelBlockstore } from 'blockstore-level'
import { LevelDatastore } from 'datastore-level'
import { join } from 'path'
import libp2pConfig from './libp2p/config.js'
import Authorization, { Access } from './authorization.js'
import { handleRequest } from './handlers/index.js'
import { voyagerProtocol } from './protocol.js'

export default async ({ directory, verbose, defaultAccess } = {}) => {
  directory = directory || join('./', 'orbiter')

  defaultAccess = defaultAccess || Access.DENY

  verbose = verbose || 0

  const path = join(directory, '/', 'keystore')

  const blockstore = new LevelBlockstore(join(directory, '/', 'ipfs', '/', 'blocks'))
  const datastore = new LevelDatastore(join(directory, '/', 'ipfs', '/', 'data'))
  const libp2p = await createLibp2p(libp2pConfig)
  const ipfs = await createHelia({ libp2p, datastore, blockstore })

  const keystore = await KeyStore({ path })
  const identities = await Identities({ keystore })
  const id = 'voyager'

  const orbitdb = await createOrbitDB({ ipfs, directory, identities, id })

  const pins = await orbitdb.open('pins', { Database: KeyValueIndexed() })

  const auth = await Authorization({ orbitdb, defaultAccess })

  const dbs = []

  const handleMessages = async ({ stream }) => {
    await pipe(stream, handleRequest({ orbitdb, pins, dbs, auth }), stream)
  }

  await orbitdb.ipfs.libp2p.handle(voyagerProtocol, handleMessages)

  for await (const db of pins.iterator()) {
    dbs[db.value] = await orbitdb.open(db.value)
    if (verbose === 3) console.log('db opened', db.value)
  }

  if (verbose === 3) console.log(dbs.length, 'dbs loaded')

  const stop = async () => {
    await orbitdb.ipfs.libp2p.unhandle(voyagerProtocol)
    await orbitdb.stop()
    await ipfs.stop()
    await blockstore.close()
    await datastore.close()
  }

  return {
    pins,
    dbs,
    orbitdb,
    ipfs,
    auth,
    stop
  }
}
