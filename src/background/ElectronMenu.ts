import { app, BrowserWindow, dialog, Menu, shell } from 'electron'
import { vxm } from '../store'
import { promises as fsPromises } from 'fs'
import createWindow from './utils'

export default class ElectronMenu {
  win: BrowserWindow
  isMac = process.platform === 'darwin'

  preferences: BrowserWindow | null = null

  template: object[] = [
    // { role: 'appMenu' }
    ...(this.isMac
      ? [
          {
            label: app.getName(),
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideothers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [
        {
          label: 'Open folder',
          click: () => {
            this.openFolder()
          },
          accelerator: 'CommandOrControl+O',
        },
        {
          label: 'Save',
          click: () => {
            this.save()
          },
          accelerator: 'CommandOrControl+S',
        },
        this.isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    // { role: 'editMenu' }
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Preferences',
          click: () => {
            createWindow(this.preferences, 'preferences', 'preferences.html')
          }
        },
        // { role: 'undo' },
        // { role: 'redo' },
        // { type: 'separator' },
        // { role: 'cut' },
        // { role: 'copy' },
        // { role: 'paste' },
        // ...(this.isMac
        //   ? [
        //       { role: 'pasteAndMatchStyle' },
        //       { role: 'delete' },
        //       { role: 'selectAll' },
        //       { type: 'separator' },
        //       {
        //         label: 'Speech',
        //         submenu: [{ role: 'startspeaking' }, { role: 'stopspeaking' }],
        //       },
        //     ]
        //   : [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }]),
      ],
    },
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: [
        // { role: 'reload' },
        // { role: 'forcereload' },
        { role: 'toggledevtools' },
        // { type: 'separator' },
        // { role: 'resetzoom' },
        // { role: 'zoomin' },
        // { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    // { role: 'windowMenu' }
    // {
    //   label: 'Window',
    //   submenu: [
    //     { role: 'minimize' },
    //     { role: 'zoom' },
    //     ...(this.isMac
    //       ? [
    //           { type: 'separator' },
    //           { role: 'front' },
    //           { type: 'separator' },
    //           { role: 'window' },
    //         ]
    //       : [{ role: 'close' }]),
    //   ],
    // },
    {
      role: 'help',
      submenu: [
        {
          label: 'Read the docs',
          click() {
            shell.openExternalSync('https://thesimplez.github.io/TerraCAD')
          },
        },
      ],
    },
  ]

  constructor(win: BrowserWindow) {
    this.win = win
    const menu = Menu.buildFromTemplate(this.template)
    // Menu.setApplicationMenu(menu)

    win.setMenu(menu)
  }
  openFolder() {
    const folderName = dialog.showOpenDialog(this.win, {
      properties: ['openDirectory'],
    })

    if (folderName) {
      vxm.graph.importTerraformFolder(folderName[0])
    }
  }

  async save() {
    const fileName = dialog.showSaveDialog(this.win, {
      defaultPath: vxm.graph.openFolder,
    })

    if (fileName) {
      await fsPromises.writeFile(fileName, JSON.stringify(vxm.graph.parsedHcl))
    }
  }
}
