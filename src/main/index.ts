import { app, shell, screen, BrowserWindow, ipcMain, Tray, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
/**
 * Magic name with "Template" suffix to make macOS use it as template image
 */
import trayIcon from '../../resources/trayTemplate.png?asset'
import { IPCInterface } from '../shared/IPCInterface'
import { dbInterface, loadDb } from './db'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 300,
    height: 800,
    show: false,
    frame: false,
    resizable: true,
    type: 'panel',
    skipTaskbar: true,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  const tray = new Tray(trayIcon)

  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : showWindowBelowTray()
  })

  tray.on('right-click', () => {
    const menu = Menu.buildFromTemplate([
      {
        label: 'Reposition Window',
        click: () => {
          mainWindow.setSize(300, 800, false)
          showWindowBelowTray()
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        click: () => {
          app.quit()
        }
      },
      {
        label: `Paw ${app.getVersion()}`,
        enabled: false,
        click: () => {
          app.quit()
        }
      }
    ])
    menu.popup()
  })

  function showWindowBelowTray(): void {
    const trayBounds = tray.getBounds()

    const primaryDisplay = screen.getPrimaryDisplay()
    const screenBounds = primaryDisplay.workArea // 不包括菜单栏和 Dock

    const { width: windowWidth, height: windowHeight } = mainWindow.getBounds()

    const x = Math.round(trayBounds.x + trayBounds.width / 2 - windowWidth / 2)
    const y = Math.round(trayBounds.y + trayBounds.height)

    // 限制在屏幕范围内（可选）
    const finalX = Math.max(
      screenBounds.x,
      Math.min(x, screenBounds.x + screenBounds.width - windowWidth)
    )
    const finalY = Math.min(screenBounds.y + screenBounds.height - windowHeight, y)

    mainWindow.setPosition(finalX, finalY, false)
    mainWindow.showInactive()
  }

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  const ipcHandler: IPCInterface = {
    ...dbInterface,
    async hideWindow() {
      mainWindow.hide()
    },
    async openImageInPreview(imagePath: string) {
      shell.openPath(imagePath)
    }
  }

  ipcMain.on('ipc-request', async (_, data) => {
    const [methodName, requestId, ...args] = data
    const result = await ipcHandler[methodName](...args)

    mainWindow.webContents.send('ipc-response', [requestId, result])
  })
  mainWindow.once('ready-to-show', () => {
    showWindowBelowTray()
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  await loadDb()
  createWindow()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
