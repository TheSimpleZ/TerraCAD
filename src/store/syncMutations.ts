import { ipcMain, ipcRenderer } from 'electron'
import { Store } from 'vuex'

const IPC_EVENT_CONNECT = 'vuex-mutations-connect'
const IPC_EVENT_NOTIFY_MAIN = 'vuex-mutations-notify-main'
const IPC_EVENT_NOTIFY_RENDERERS = 'vuex-mutations-notify-renderers'

interface Mutation {
  type: string
  payload: any
}

function runRendererLogic<T>(store: Store<T>) {
  // Connect renderer to main process
  ipcRenderer.send(IPC_EVENT_CONNECT)

  let mainMutating = false

  // Subscribe on changes from main process and apply them
  ipcRenderer.on(
    IPC_EVENT_NOTIFY_RENDERERS,
    (event: any, { type, payload }: Mutation) => {
      mainMutating = true
      store.commit(type, payload)
      mainMutating = false
    },
  )

  // Subscribe on changes from Vuex store
  store.subscribe(mutation => {
    if (!mainMutating) {
      const { type, payload } = mutation

      // Forward changes to renderer processes
      ipcRenderer.send(IPC_EVENT_NOTIFY_MAIN, { type, payload })
    }
  })
}

function runMainLogic<T>(store: Store<T>) {
  const connections: any = {}

  // Save new connection
  ipcMain.on(IPC_EVENT_CONNECT, (event: any) => {
    const win = event.sender
    const winId = win.id

    connections[winId] = win

    // Remove connection when window is closed
    win.on('destroyed', () => {
      delete connections[winId]
    })
  })

  // Subscribe on changes from renderer processes
  ipcMain.on(
    IPC_EVENT_NOTIFY_MAIN,
    (event: any, { type, payload }: Mutation) => {
      const win = event.sender
      const winId = win.id
      delete connections[winId]
      store.commit(type, payload)
      connections[winId] = win
    },
  )

  // Subscribe on changes from Vuex store
  store.subscribe(mutation => {
    if (connections) {
      const { type, payload } = mutation

      // Forward changes to renderer processes
      for (const processId of Object.keys(connections)) {
        connections[processId].send(IPC_EVENT_NOTIFY_RENDERERS, {
          type,
          payload,
        })
      }
    }
  })
}

export default function syncMutations<T>(store: Store<T>) {
  if (process.type === 'renderer') {
    runRendererLogic(store)
  } else {
    runMainLogic(store)
  }
}
