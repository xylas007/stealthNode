// ═══════════════════════════════════════════════════════════
// StealthNode — Electron Main Process
// ═══════════════════════════════════════════════════════════

import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, NativeImage, dialog, clipboard, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { initDatabase, closeDatabase } from './db/database'
import { registerIpcHandlers } from './ipc/handlers'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false
let autoLockTimer: NodeJS.Timeout | null = null
let shouldMinimizeToTray = false

// ─── Single Instance Lock ──────────────────────────────────

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// ─── App Data Directory ────────────────────────────────────

const APP_DATA_DIR = path.join(app.getPath('appData'), 'StealthNode')
if (!fs.existsSync(APP_DATA_DIR)) {
  fs.mkdirSync(APP_DATA_DIR, { recursive: true })
}

// ─── Create Main Window ────────────────────────────────────

function createWindow() {
  const preloadPath = path.join(__dirname, '../preload/preload.js')

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    transparent: false,
    backgroundColor: '#0D0D12',
    show: false,
    icon: path.join(__dirname, '../../assets/logo.ico'),
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  })

  // Always start maximized
  mainWindow.maximize()

  // Dev or prod URL
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Minimize to tray on close (if setting enabled)
  mainWindow.on('close', (event) => {
    if (!isQuitting && shouldMinimizeToTray) {
      event.preventDefault()
      mainWindow?.hide()
      return
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Track window state for title bar buttons
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window-state-changed', true)
  })
  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window-state-changed', false)
  })
}

// ─── System Tray ───────────────────────────────────────────

function createTray() {
  const iconPath = path.join(__dirname, '../../assets/logo.ico')
  let trayIcon: NativeImage

  try {
    trayIcon = nativeImage.createFromPath(iconPath)
    if (trayIcon.isEmpty()) {
      trayIcon = nativeImage.createEmpty()
    }
  } catch {
    trayIcon = nativeImage.createEmpty()
  }

  tray = new Tray(trayIcon)
  tray.setToolTip('StealthNode')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open StealthNode',
      click: () => {
        if (!mainWindow) {
          createWindow()
        } else {
          mainWindow.show()
          if (mainWindow.isMinimized()) mainWindow.restore()
          mainWindow.focus()
        }
      }
    },
    {
      label: 'Lock Vault',
      click: () => {
        mainWindow?.webContents.send('vault-lock-requested')
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    if (!mainWindow) {
      createWindow()
    } else {
      mainWindow.show()
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// ─── IPC: Window Controls ──────────────────────────────────

ipcMain.handle('window:minimize', () => mainWindow?.minimize())
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})
ipcMain.handle('window:close', () => mainWindow?.close())
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false)
ipcMain.handle('app:setMinimizeToTray', (_event, val: boolean) => { shouldMinimizeToTray = val })

// ─── IPC: Clipboard ────────────────────────────────────────

let clipboardTimer: NodeJS.Timeout | null = null

ipcMain.handle('clipboard:copy', (_event, text: string, clearDuration: number) => {
  clipboard.writeText(text)
  if (clipboardTimer) clearTimeout(clipboardTimer)
  if (clearDuration > 0) {
    clipboardTimer = setTimeout(() => {
      // Only clear if the clipboard still has our text
      if (clipboard.readText() === text) {
        clipboard.writeText('')
      }
      mainWindow?.webContents.send('clipboard-cleared')
    }, clearDuration * 1000)
  }
})

// ─── IPC: Shell ────────────────────────────────────────────

ipcMain.handle('shell:openFolder', (_event, folderPath: string) => {
  shell.openPath(folderPath)
})

ipcMain.handle('dialog:selectFile', async (_event, filters: any[]) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: filters || [{ name: 'All Files', extensions: ['*'] }]
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('dialog:selectFiles', async (_event, filters: any[]) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile', 'multiSelections'],
    filters: filters || [{ name: 'All Files', extensions: ['*'] }]
  })
  return result.canceled ? [] : result.filePaths
})

// ─── IPC: App Info ─────────────────────────────────────────

ipcMain.handle('app:getVersion', () => app.getVersion() || '1.0.0')
ipcMain.handle('app:getDataDir', () => APP_DATA_DIR)

// ─── App Lifecycle ─────────────────────────────────────────

app.whenReady().then(async () => {
  await initDatabase(APP_DATA_DIR)
  registerIpcHandlers(APP_DATA_DIR)
  createWindow()
  createTray()
})

app.on('window-all-closed', () => {
  if (!shouldMinimizeToTray) {
    app.quit()
  }
})

app.on('before-quit', () => {
  isQuitting = true
  if (autoLockTimer) clearTimeout(autoLockTimer)
  if (clipboardTimer) clearTimeout(clipboardTimer)
  closeDatabase()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
