declare const __static: string
import path from 'path'

import { BrowserWindow, Menu } from 'electron'
import ElectronMenu from './ElectronMenu'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'

let createdAppProtocol = false

export default function createWindow(
  winVar: BrowserWindow | null,
  devPath: string,
  prodPath: string,
  enableMenu: boolean = false,
  maximized: boolean = false,
) {
  Menu.setApplicationMenu(null)
  // Create the browser window.
  winVar = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
    icon: path.join(__static, 'icon.png'),
  })

  if (enableMenu) {
    const menu = new ElectronMenu(winVar)
  } else {
    winVar.removeMenu()
  }

  if (maximized) {
    winVar.maximize()
  }

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
