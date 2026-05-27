// ═══════════════════════════════════════════════════════════
// StealthNode — Preload Script (Context Bridge)
// ═══════════════════════════════════════════════════════════

import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('stealthNode', {
  // ─── Profile ───────────────────────────────────────────
  getProfiles: () => ipcRenderer.invoke('profile:getAll'),
  createProfile: (data: any) => ipcRenderer.invoke('profile:create', data),
  deleteProfile: (id: string) => ipcRenderer.invoke('profile:delete', id),
  updateProfile: (id: string, data: any) => ipcRenderer.invoke('profile:update', id, data),

  // ─── Auth ──────────────────────────────────────────────
  unlockVault: (profileId: string, password: string) => ipcRenderer.invoke('auth:unlock', profileId, password),
  lockVault: () => ipcRenderer.invoke('auth:lock'),
  verifyPassword: (password: string) => ipcRenderer.invoke('auth:verifyPassword', password),
  changePassword: (currentPassword: string, newPassword: string) => ipcRenderer.invoke('auth:changePassword', currentPassword, newPassword),
  verifySecurityQuestions: (profileId: string, answers: string[]) => ipcRenderer.invoke('auth:verifySecurityQuestions', profileId, answers),

  // ─── Entries ───────────────────────────────────────────
  getEntries: (category?: string, folderId?: string) => ipcRenderer.invoke('entry:getAll', category, folderId),
  getEntry: (id: string) => ipcRenderer.invoke('entry:get', id),
  createEntry: (data: any) => ipcRenderer.invoke('entry:create', data),
  updateEntry: (id: string, data: any) => ipcRenderer.invoke('entry:update', id, data),
  deleteEntry: (id: string) => ipcRenderer.invoke('entry:delete', id),
  searchEntries: (query: string) => ipcRenderer.invoke('entry:search', query),

  // ─── Trash ─────────────────────────────────────────────
  getTrashEntries: () => ipcRenderer.invoke('trash:getAll'),
  restoreEntry: (id: string) => ipcRenderer.invoke('trash:restore', id),
  hardDeleteEntry: (id: string) => ipcRenderer.invoke('trash:hardDelete', id),

  // ─── Collections ───────────────────────────────────────
  getCollections: () => ipcRenderer.invoke('collection:getAll'),
  createCollection: (data: any) => ipcRenderer.invoke('collection:create', data),
  updateCollection: (id: string, data: any) => ipcRenderer.invoke('collection:update', id, data),
  deleteCollection: (id: string) => ipcRenderer.invoke('collection:delete', id),

  // ─── Clipboard ─────────────────────────────────────────
  copyToClipboard: (text: string, clearDuration?: number) => ipcRenderer.invoke('clipboard:copy', text, clearDuration ?? 30),

  // ─── Settings ──────────────────────────────────────────
  getSettings: (profileId: string) => ipcRenderer.invoke('settings:get', profileId),
  updateSettings: (profileId: string, data: any) => ipcRenderer.invoke('settings:update', profileId, data),

  // ─── File Storage ──────────────────────────────────────
  storeFile: (filePath: string) => ipcRenderer.invoke('file:store', filePath),
  storeMultipleFiles: (filePaths: string[]) => ipcRenderer.invoke('file:storeMultiple', filePaths),
  getFilePath: (fileId: string) => ipcRenderer.invoke('file:getPath', fileId),
  openFile: (storedPath: string) => ipcRenderer.invoke('file:open', storedPath),
  deleteFile: (storedPath: string) => ipcRenderer.invoke('file:delete', storedPath),
  readFileAsBase64: (storedPath: string) => ipcRenderer.invoke('file:readAsBase64', storedPath),

  // ─── Backup & Restore ─────────────────────────────────
  createBackup: (password: string) => ipcRenderer.invoke('backup:create', password),
  selectBackupFile: () => ipcRenderer.invoke('backup:selectFile'),
  restoreBackup: (filePath: string, password?: string) => ipcRenderer.invoke('backup:restore', filePath, password),

  // ─── Import/Export ─────────────────────────────────────
  importJSON: () => ipcRenderer.invoke('import:json'),
  importCSV: () => ipcRenderer.invoke('import:csv'),
  exportJSON: () => ipcRenderer.invoke('export:json'),
  exportCSV: () => ipcRenderer.invoke('export:csv'),

  // ─── Window ────────────────────────────────────────────
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // ─── Dialog ────────────────────────────────────────────
  selectFile: (filters?: any[]) => ipcRenderer.invoke('dialog:selectFile', filters),
  selectFiles: (filters?: any[]) => ipcRenderer.invoke('dialog:selectFiles', filters),
  openFolder: (path: string) => ipcRenderer.invoke('shell:openFolder', path),

  // ─── App ───────────────────────────────────────────────
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  getDataDir: () => ipcRenderer.invoke('app:getDataDir'),
  setMinimizeToTray: (val: boolean) => ipcRenderer.invoke('app:setMinimizeToTray', val),

  // ─── Events (Main → Renderer) ──────────────────────────
  onWindowStateChanged: (callback: (isMaximized: boolean) => void) => {
    ipcRenderer.on('window-state-changed', (_e, val) => callback(val))
  },
  onVaultLockRequested: (callback: () => void) => {
    ipcRenderer.on('vault-lock-requested', () => callback())
  },
  onClipboardCleared: (callback: () => void) => {
    ipcRenderer.on('clipboard-cleared', () => callback())
  },
  onAutoLockWarning: (callback: () => void) => {
    ipcRenderer.on('auto-lock-warning', () => callback())
  }
})
