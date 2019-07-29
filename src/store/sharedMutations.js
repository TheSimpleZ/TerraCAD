import { ipcMain, ipcRenderer } from 'electron'

const IPC_EVENT_CONNECT = 'vuex-mutations-connect'
const IPC_EVENT_NOTIFY_MAIN = 'vuex-mutations-notify-main'
const IPC_EVENT_NOTIFY_RENDERERS = 'vuex-mutations-notify-renderers'

class SharedMutations {
  constructor(options, store) {
    this.options = options
    this.store = store
  }

  loadOptions() {
    if (!this.options.type)
      this.options.type = process.type === 'renderer' ? 'renderer' : 'main'
    if (!this.options.ipcMain) this.options.ipcMain = ipcMain
    if (!this.options.ipcRenderer) this.options.ipcRenderer = ipcRenderer
  }

  connect(payload) {
    this.options.ipcRenderer.send(IPC_EVENT_CONNECT, payload)
  }

  onConnect(handler) {
    this.options.ipcMain.on(IPC_EVENT_CONNECT, handler)
  }

  notifyMain(payload) {
    this.options.ipcRenderer.send(IPC_EVENT_NOTIFY_MAIN, payload)
  }

  onNotifyMain(handler) {
    this.options.ipcMain.on(IPC_EVENT_NOTIFY_MAIN, handler)
  }

  notifyRenderers(connections, payload) {
    Object.keys(connections).forEach(processId => {
      connections[processId].send(IPC_EVENT_NOTIFY_RENDERERS, payload)
    })
  }

  onNotifyRenderers(handler) {
    this.options.ipcRenderer.on(IPC_EVENT_NOTIFY_RENDERERS, handler)
  }

  rendererProcessLogic() {
    // Connect renderer to main process
    this.connect()

    var mainMutating = false

    // Subscribe on changes from main process and apply them
    this.onNotifyRenderers((event, { type, payload }) => {
      mainMutating = true
      this.store.commit(type, payload)
      mainMutating = false
    })

    // Subscribe on changes from Vuex store
    this.store.subscribe(mutation => {
      if (!mainMutating) {
        const { type, payload } = mutation

        // Forward changes to renderer processes
        this.notifyMain({ type, payload })
      }
    })
  }

  mainProcessLogic() {
    const connections = {}

    // Save new connection
    this.onConnect(event => {
      const win = event.sender
      const winId = win.id

      connections[winId] = win

      // Remove connection when window is closed
      win.on('destroyed', () => {
        delete connections[winId]
      })
    })

    // Subscribe on changes from renderer processes
    this.onNotifyMain((event, { type, payload }) => {
      const win = event.sender
      const winId = win.id
      delete connections[winId]
      this.store.commit(type, payload)
      connections[winId] = win
    })

    // Subscribe on changes from Vuex store
    this.store.subscribe(mutation => {
      if (connections) {
        const { type, payload } = mutation

        // Forward changes to renderer processes

        this.notifyRenderers(connections, { type, payload })
      }
    })
  }

  activatePlugin() {
    switch (this.options.type) {
      case 'renderer':
        this.rendererProcessLogic()
        break
      case 'main':
        this.mainProcessLogic()
        break
      default:
        throw new Error(`[Vuex Electron] Type should be "renderer" or "main".`)
    }
  }
}

export default (options = {}) => store => {
  const sharedMutations = new SharedMutations(options, store)

  sharedMutations.loadOptions()
  sharedMutations.activatePlugin()
}
