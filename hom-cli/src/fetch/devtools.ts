import WebSocket from 'ws'
import stringify from 'json-stable-stringify'

class DevTools {
  ws: WebSocket
  netListeners: Map<string, any>
  listeners: Map<string, any>
  cache: Map<string, any>

  static new(address: string): Promise<DevTools> {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(address)
        ws.on('open', () => {
          resolve(new this(ws))
        })
      } catch (e) {
        reject(e)
      }
    })
  }

  private constructor(websocket: WebSocket) {
    this.ws = websocket
    this.listeners = new Map()
    this.netListeners = new Map()
    this.cache = new Map()

    websocket.on('message', data => {
      const dataObj = JSON.parse(data)
      if (dataObj.applicationType) {return}
      this.checkNetworkActivity(dataObj)
      this.checkListener(dataObj)
    })
  }

  getProcess(): any {
    return this.send({ type: 'getProcess', id: 0, to: 'root' }, 'root')
  }

  async getTarget(): Promise<any> {
    const process = await this.getProcess()
    return this.send({ type: 'getTarget', to: process.processDescriptor.actor }, process.processDescriptor.actor)
  }

  async monitorNetworkActivity(): Promise<any> {
    const target = await this.getTarget()
    const netMap = new Map()
    this.addNetworkListener(target.process.consoleActor, netMap)
    const result = await this.send({ type: 'startListeners', listeners: ['NetworkActivity'], to: target.process.consoleActor }, target.process.consoleActor, { noCache: true })
    if (!result.startedListeners.includes('NetworkActivity')) { throw new Error('NetworkActivity Event Listener was not registered...') }
    return target.process.consoleActor
  }

  async finishNetworkActivity(listenerActor) {
    const netMap = this.netListeners.get(listenerActor)
    this.netListeners.delete(listenerActor)
    const result = await this.send({ type: 'stopListeners', listeners: ['NetworkActivity'], to: listenerActor }, listenerActor, { noCache: true })
    if (!result.stoppedListeners.includes('NetworkActivity')) { throw new Error('NetworkActivity Event Listener was not registered...') }
    return netMap
  }

  checkNetworkActivity(dataObj) {
    if (dataObj.type && dataObj.type === 'networkEvent') {
      const netMap = this.netListeners.get(dataObj.from)
      if (!netMap) { return }

      // We don't care it it was a system principal request
      if (dataObj.eventActor.isSystemPrincipal) {
        return
      } else if (dataObj.eventActor.isSystemPrincipal === false) {
        delete dataObj.eventActor.isSystemPrincipal
      }

      dataObj.eventActor.updates = {}
      netMap.set(dataObj.eventActor.actor, dataObj.eventActor)
    } else if (dataObj.type && dataObj.type === 'networkEventUpdate') {
      const keys = this.netListeners.forEach((netMap) => {
        const netEvent = netMap.get(dataObj.from)
        if (!netEvent) { return }
        const updateType = dataObj.updateType
        delete dataObj.type
        delete dataObj.updateType
        delete dataObj.from
        netEvent.updates[updateType] = dataObj
      })
    }
  }

  async disableCache(disable: boolean) {
    const target = await this.getTarget()
    return this.send({
      type: 'reconfigure',
      options: {cacheDisabled: disable},
      to: target.process.actor,
    }, target.process.actor,
    { noCache: true })
  }

  addListener(listenerKey, resolve, reject, cacheKey) {
    const obj = { resolve, reject, cacheKey }
    const arr = this.listeners.get(listenerKey)
    if (!arr) {
      this.listeners.set(listenerKey, [obj])
    } else {
      arr.push(obj)
      this.listeners.set(listenerKey, arr)
    }
  }

  addNetworkListener(from, map) {
    this.netListeners.set(from, map)
  }

  checkListener(dataObj) {
    let listenerKey = dataObj.from
    if (dataObj.type) { listenerKey += '-' + dataObj.type }
    const arr = this.listeners.get(listenerKey)
    if (arr) {
      this.listeners.delete(listenerKey)
      arr.forEach(({resolve, reject, cacheKey}) => {
        if (cacheKey) {
          this.cache.set(cacheKey, dataObj)
        }
        resolve(dataObj)
      })
    }
  }

  send(requestData, listenerKey, options: { forceReload?: boolean, noCache?: boolean } = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const cacheKey = stringify({requestData, listenerKey})
      if (!options.forceReload) {
        const res = this.cache.get(cacheKey)
        if (res) {
          resolve(res)
          return
        }
      }
      this.addListener(listenerKey, resolve, reject, options.noCache ? undefined : cacheKey)
      this.ws.send(JSON.stringify(requestData))
    })
  }
}

export default DevTools
