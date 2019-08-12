import { ipcMain, ipcRenderer } from 'electron'
import { Store } from 'vuex'

const CONNECT = '883c488b-55a0-4f31-acbe-5b580e62d36f'
const NOTIFY_MAIN = 'f8a12fda-4267-4faf-ba90-2d782bb0e771'
const NOTIFY_RENDERERS = '2f8bfa0b-67b2-4b1a-b185-9ac3c424d6cd'

interface Mutation {
  type: string
  payload: any
}

function runRendererLogic<T>(store: Store<T>) {
  // Connect renderer to main process
  ipcRenderer.send(CONNECT)

  let mainMutating = false

  // Subscribe on changes from main process and apply them
  ipcRenderer.on(
    NOTIFY_RENDERERS,
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
      ipcRenderer.send(NOTIFY_MAIN, { type, payload })
    }
  })
}

function runMainLogic<T>(store: Store<T>) {
  const connections: any = {}

  // Save new connection
  ipcMain.on(CONNECT, (event: any) => {
    const win = event.sender
    const winId = win.id

    connections[winId] = win

    // Remove connection when window is closed
    win.on('destroyed', () => {
      delete connections[winId]
    })
  })

  // Subscribe on changes from renderer processes
  ipcMain.on(NOTIFY_MAIN, (event: any, { type, payload }: Mutation) => {
    const win = event.sender
    const winId = win.id
    delete connections[winId]
    store.commit(type, payload)
    connections[winId] = win
  })

  // Subscribe on changes from Vuex store
  store.subscribe(mutation => {
    if (connections) {
      const { type, payload } = mutation

      // Forward changes to renderer processes
      for (const processId of Object.keys(connections)) {
        connections[processId].send(NOTIFY_RENDERERS, {
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
