import { SetDb } from '@orbitdb/set-db'
import { useDatabaseType } from '@orbitdb/core'

export const Access = Object.freeze({
  ALLOW: 1,
  DENY: 2
})

export default async ({ orbitdb, defaultAccess }) => {
  defaultAccess = defaultAccess || Access.DENY

  useDatabaseType(SetDb)

  const access = await orbitdb.open('access', { type: 'set' })

  const add = async (id) => {
    await access.add(id)
  }

  const del = async (id) => {
    await access.del(id)
  }

  const hasAccess = async (id) => {
    let found = false

    // @TODO is there a database which stores unique values + can get by value?
    // @TODO add has(value) function to SetDB
    for await (const { value } of access.iterator()) {
      if (value === id) {
        found = true
        break
      }
    }

    return defaultAccess === Access.DENY ? found : !found
  }

  const all = async () => {
    const all = (await access.all()).map(e => e.value)
    return all
  }

  const close = async () => {
    await access.close()
  }

  return {
    defaultAccess,
    add,
    del,
    hasAccess,
    all,
    close
  }
}
