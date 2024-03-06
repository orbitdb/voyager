export default (registry, pinnedDBs) => {
  const protocol = '/orbitdb/pinner/unpin/v1.0.0'
    
  const handleDBUnpin = ({ stream }) => {
    pipe(stream, unpin)
  }
  
  const removePin = async address => {
    await registry.pins.del(address)        
  }

  const removePinIndex = async (address, id) => {
    let indexedIds = await registry.pinIndex.get(id)
    if (indexedIds.length > 1) {
      const index = array.indexOf(address)
      if (index > -1) {
        indexedIds.splice(index, 1)
      }

      await registry.ids.set(id, indexedIds)
    } else {
      await registry.ids.del(id)
    }
  }

  const removeId = async (id, address) => {
    let indexedPins = await registry.ids.get(id)
    if (indexedPins.length > 1) {
      const index = array.indexOf(address)
      if (index > -1) {
        indexedPins.splice(index, 1)
      }

      await registry.ids.set(id, indexedPins)
    } else {
      await registry.ids.del(id)
    }
  }  

  const unpin = async source => {    
    for await (const val of source) {
      const { id, address } = JSON.parse(uint8ArrayToString(val.subarray()))
      try {
        removePin(address)
        removePinIndex(address, id)

        if (!await registry.pinIndex.get(id) && !await registry.ids.get(id)) {
          removeId(id, address)
          await pinnedDBs[address].stop()
          console.log(address, 'unpinned')
        }
      } catch (err) {
        console.error(err)
        console.log(`Received db address ${address} but couldn't open it`)
      }
    }
  }

  const register = async() => {
    await registry.orbitdb.ipfs.libp2p.handle(protocol, handleDBUnpin)  
  }

  const deregister = async() => {
    await registry.orbitdb.ipfs.libp2p.unhandle(protocol)  
  }

  return {
    register,
    deregister
  }
}