'use strict'
declare const __static: string
import path from 'path'

import { app, BrowserWindow, protocol } from 'electron'
import {
  createProtocol,
  installVueDevtools,
} from 'vue-cli-plugin-electron-builder/lib'
import './plugins/vuex'
import './store'
import ElectronMenu from './background/ElectronMenu'

const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null
let secondWin: BrowserWindow | null
let createdAppProtocol = false

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
])

function createWindow(
  winVar: BrowserWindow | null,
  devPath: string,
  prodPath: string,
) {
  // Create the browser window.
  winVar = new BrowserWindow({ width: 800, height: 600, icon: path.join(__static, 'icon.png') })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    winVar.loadURL(process.env.WEBPACK_DEV_SERVER_URL + devPath)
    if (!process.env.IS_TEST) {
      winVar.webContents.openDevTools()
    }
  } else {
    if (!createdAppProtocol) {
      createProtocol('app')
      createdAppProtocol = true
    }
    // Load the index.html when not in development
    winVar.loadURL(`app://./${prodPath}`)
  }

  winVar.on('closed', () => {
    winVar = null
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow(win, '', 'index.html')
  }

  // if (secondWin === null) {
  //   createWindow(secondWin, 'preferences', 'preferences.html')
  // }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installVueDevtools()
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow(win, '', 'index.html')
  // createWindow(secondWin, 'preferences', 'preferences.html')
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
