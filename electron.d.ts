/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    VITE_DEV_SERVER_URL: string
  }
}

interface Window {
  stealthNode: {
    // Profile
    getProfiles: () => Promise<any[]>
    createProfile: (data: any) => Promise<any>
    deleteProfile: (id: string) => Promise<void>
    // Auth
    unlockVault: (profileId: string, password: string) => Promise<boolean>
    lockVault: () => Promise<void>
    verifyPassword: (password: string) => Promise<boolean>
    // Entries
    getEntries: (category?: string, folderId?: string) => Promise<any[]>
    getEntry: (id: string) => Promise<any>
    createEntry: (data: any) => Promise<any>
    updateEntry: (id: string, data: any) => Promise<any>
    deleteEntry: (id: string) => Promise<void>
    // Collections
    getCollections: () => Promise<any[]>
    createCollection: (data: any) => Promise<any>
    updateCollection: (id: string, data: any) => Promise<any>
    deleteCollection: (id: string, password: string) => Promise<void>
    // Clipboard
    copyToClipboard: (text: string) => Promise<void>
    // Settings
    getSettings: () => Promise<any>
    updateSettings: (data: any) => Promise<void>
    // Backup
    createBackup: (manual: boolean) => Promise<string>
    restoreBackup: (filePath: string, password: string) => Promise<void>
    getAutoBackups: () => Promise<any[]>
    // Import/Export
    importCSV: (filePath: string) => Promise<any>
    exportCSV: () => Promise<string>
    exportJSON: () => Promise<string>
    // Window
    minimize: () => void
    maximize: () => void
    close: () => void
    isMaximized: () => Promise<boolean>
    // File
    selectFile: (filters?: any[]) => Promise<string | null>
    openFolder: (path: string) => Promise<void>
    // Misc
    getAppVersion: () => Promise<string>
    setMinimizeToTray: (val: boolean) => Promise<void>
    onAutoLockWarning: (callback: () => void) => void
    onVaultLocked: (callback: () => void) => void
  }
}
