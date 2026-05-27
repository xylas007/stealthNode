// ═══════════════════════════════════════════════════════════
// StealthNode — IPC Handlers
// ═══════════════════════════════════════════════════════════

import { ipcMain, dialog, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { hashPassword, verifyPassword, deriveRawKey, hashAnswer, verifyAnswer, generateSalt } from '../crypto/auth'
import { encrypt, decrypt } from '../crypto/encryption'
import * as db from '../db/database'
import { MAX_PASSWORD_ATTEMPTS, PASSWORD_LOCKOUT_DURATION } from '../../shared/constants'

let sessionKey: Buffer | null = null

export function registerIpcHandlers(appDataDir: string) {
  // ─── Profile ─────────────────────────────────────────
  ipcMain.handle('profile:getAll', () => {
    const profiles = db.getAllProfiles()
    return profiles.map(p => ({ ...p, passwordHash: undefined, salt: undefined, securityQuestions: p.securityQuestions.map(q => ({ question: q.question })) }))
  })

  ipcMain.handle('profile:create', async (_e, data) => {
    const salt = generateSalt()
    const pwHash = await hashPassword(data.password)
    const sqHashed = []
    for (const sq of data.securityQuestions) {
      sqHashed.push({ question: sq.question, answerHash: await hashAnswer(sq.answer) })
    }
    const profile = db.createProfile({ ...data, passwordHash: pwHash, salt, securityQuestions: sqHashed })
    return { ...profile, passwordHash: undefined, salt: undefined }
  })

  ipcMain.handle('profile:delete', (_e, id) => db.deleteProfileFromDb(id))

  ipcMain.handle('profile:update', (_e, id, data) => {
    db.updateProfile(id, data)
    return db.getProfile(id)
  })

  // ─── Auth ────────────────────────────────────────────
  ipcMain.handle('auth:unlock', async (_e, profileId: string, password: string) => {
    const profile = db.getProfile(profileId)
    if (!profile) return { success: false, error: 'Profile not found' }

    if (profile.lockoutUntil) {
      const lockoutTime = new Date(profile.lockoutUntil).getTime()
      if (Date.now() < lockoutTime) {
        const remaining = Math.ceil((lockoutTime - Date.now()) / 60000)
        return { success: false, error: `Account locked. Try again in ${remaining} minutes.`, locked: true, remaining }
      }
      db.updateProfile(profileId, { lockoutUntil: null, failedAttempts: 0 })
    }

    const valid = await verifyPassword(password, profile.passwordHash)
    if (!valid) {
      const attempts = profile.failedAttempts + 1
      if (attempts >= MAX_PASSWORD_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + PASSWORD_LOCKOUT_DURATION).toISOString()
        db.updateProfile(profileId, { failedAttempts: attempts, lockoutUntil: lockUntil })
        return { success: false, error: 'Too many attempts. Account locked for 15 minutes.', locked: true, remaining: 15 }
      }
      db.updateProfile(profileId, { failedAttempts: attempts })
      return { success: false, error: `Incorrect password. ${MAX_PASSWORD_ATTEMPTS - attempts} attempts remaining.` }
    }

    db.updateProfile(profileId, { failedAttempts: 0, lockoutUntil: null, lastUnlockedAt: new Date().toISOString() })
    sessionKey = await deriveRawKey(password, profile.salt)
    await db.openVaultDatabase(profileId)
    return { success: true }
  })

  ipcMain.handle('auth:lock', () => {
    sessionKey = null
    db.closeVaultDatabase()
    return { success: true }
  })

  ipcMain.handle('auth:verifyPassword', async (_e, password: string) => {
    const profileId = db.getCurrentProfileId()
    if (!profileId) return false
    const profile = db.getProfile(profileId)
    if (!profile) return false
    return await verifyPassword(password, profile.passwordHash)
  })

  ipcMain.handle('auth:changePassword', async (_e, currentPassword: string, newPassword: string) => {
    const profileId = db.getCurrentProfileId()
    if (!profileId) return { success: false, error: 'No active profile' }
    const profile = db.getProfile(profileId)
    if (!profile) return { success: false, error: 'Profile not found' }

    const valid = await verifyPassword(currentPassword, profile.passwordHash)
    if (!valid) return { success: false, error: 'Current password incorrect' }

    const newHash = await hashPassword(newPassword)
    const newSalt = generateSalt()
    sessionKey = await deriveRawKey(newPassword, newSalt)
    db.updateProfile(profileId, { passwordHash: newHash, salt: newSalt })
    return { success: true }
  })

  // ─── Entries ─────────────────────────────────────────
  ipcMain.handle('entry:getAll', (_e, cat, folderId) => db.getAllEntries(cat, folderId))
  ipcMain.handle('entry:get', (_e, id) => db.getEntryById(id))
  ipcMain.handle('entry:create', (_e, data) => db.createEntryInDb(data))
  ipcMain.handle('entry:update', (_e, id, data) => db.updateEntryInDb(id, data))
  ipcMain.handle('entry:delete', (_e, id) => db.deleteEntryFromDb(id))
  ipcMain.handle('entry:search', (_e, query) => db.searchEntries(query))

  // ─── Trash ──────────────────────────────────────────
  ipcMain.handle('trash:getAll', () => db.getTrashEntries())
  ipcMain.handle('trash:restore', (_e, id) => db.restoreEntryFromDb(id))
  ipcMain.handle('trash:hardDelete', (_e, id) => db.hardDeleteEntryFromDb(id))

  // ─── Collections ─────────────────────────────────────
  ipcMain.handle('collection:getAll', () => db.getAllCollections())
  ipcMain.handle('collection:create', (_e, data) => db.createCollectionInDb(data))
  ipcMain.handle('collection:update', (_e, id, data) => db.updateCollectionInDb(id, data))
  ipcMain.handle('collection:delete', (_e, id) => db.deleteCollectionFromDb(id))

  // ─── Settings ────────────────────────────────────────
  ipcMain.handle('settings:get', (_e, profileId) => db.getSettings(profileId))
  ipcMain.handle('settings:update', (_e, profileId, data) => db.updateSettingsInDb(profileId, data))

  // ─── Encrypt/Decrypt helpers for renderer ────────────
  ipcMain.handle('crypto:encrypt', (_e, plaintext: string) => {
    if (!sessionKey) throw new Error('Vault locked')
    return encrypt(plaintext, sessionKey)
  })
  ipcMain.handle('crypto:decrypt', (_e, ciphertext: string, iv: string, authTag: string) => {
    if (!sessionKey) throw new Error('Vault locked')
    return decrypt(ciphertext, sessionKey, iv, authTag)
  })

  // ─── File Storage ───────────────────────────────────
  ipcMain.handle('file:store', (_e, filePath: string) => {
    return db.storeFile(filePath)
  })

  ipcMain.handle('file:storeMultiple', async (_e, filePaths: string[]) => {
    const results = []
    for (const fp of filePaths) {
      results.push(db.storeFile(fp))
    }
    return results
  })

  ipcMain.handle('file:getPath', (_e, fileId: string) => {
    return db.getStoredFilePath(fileId)
  })

  ipcMain.handle('file:open', (_e, storedPath: string) => {
    if (storedPath && fs.existsSync(storedPath)) {
      shell.openPath(storedPath)
    }
  })

  ipcMain.handle('file:delete', (_e, storedPath: string) => {
    db.deleteStoredFile(storedPath)
  })

  ipcMain.handle('file:readAsBase64', (_e, storedPath: string) => {
    if (storedPath && fs.existsSync(storedPath)) {
      return fs.readFileSync(storedPath).toString('base64')
    }
    return null
  })

  // ─── Backup & Restore ──────────────────────────────
  ipcMain.handle('backup:create', async (_e, password: string) => {
    if (!password) return { success: false, error: 'Password required' }
    const jsonData = db.createBackupJson()
    
    // Encrypt the JSON data using the password
    const salt = generateSalt()
    const key = await deriveRawKey(password, salt)
    const encrypted = encrypt(jsonData, key)
    const backupPayload = JSON.stringify({
      encrypted: true,
      salt,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag
    }, null, 2)

    const result = await dialog.showSaveDialog({
      title: 'Save Encrypted Backup',
      defaultPath: `StealthNode_Backup_${new Date().toISOString().split('T')[0]}.json`,
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    })
    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, backupPayload, 'utf-8')
      return { success: true, path: result.filePath }
    }
    return { success: false }
  })

  ipcMain.handle('backup:selectFile', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Backup File',
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
      properties: ['openFile']
    })
    if (!result.canceled && result.filePaths[0]) {
      const filePath = result.filePaths[0]
      try {
        const jsonString = fs.readFileSync(filePath, 'utf-8')
        const payload = JSON.parse(jsonString)
        return { success: true, filePath, encrypted: !!payload.encrypted }
      } catch {
        return { success: false, error: 'Invalid backup file format' }
      }
    }
    return { success: false, canceled: true }
  })

  ipcMain.handle('backup:restore', async (_e, filePath: string, password?: string) => {
    try {
      const jsonString = fs.readFileSync(filePath, 'utf-8')
      const payload = JSON.parse(jsonString)
      let decryptedData = ''
      if (payload.encrypted) {
        if (!password) return { success: false, error: 'Password required to decrypt this backup' }
        try {
          const key = await deriveRawKey(password, payload.salt)
          decryptedData = decrypt(payload.ciphertext, key, payload.iv, payload.authTag)
        } catch {
          return { success: false, error: 'Incorrect password for this backup' }
        }
      } else {
        decryptedData = jsonString
      }
      db.restoreBackupJson(decryptedData)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: 'Failed to restore backup: ' + err.message }
    }
  })

  // ─── Export ─────────────────────────────────────────
  ipcMain.handle('export:json', async (_e) => {
    const entries = db.exportAllEntries()
    const exportData = JSON.stringify({ version: '1.0.0', exportedAt: new Date().toISOString(), entries }, null, 2)
    const result = await dialog.showSaveDialog({
      title: 'Export Vault',
      defaultPath: `StealthNode_Export_${new Date().toISOString().split('T')[0]}.json`,
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    })
    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, exportData, 'utf-8')
      return { success: true, path: result.filePath, count: entries.length }
    }
    return { success: false }
  })

  ipcMain.handle('export:csv', async (_e) => {
    const entries = db.exportAllEntries()
    const headers = ['title', 'category', 'username', 'email', 'password', 'websiteUrl', 'notes', 'tokenValue', 'bankName', 'accountNumber', 'linkUrl']
    const csvRows = [headers.join(',')]
    for (const e of entries) {
      const row = headers.map(h => {
        const val = (e as any)[h] || ''
        return `"${String(val).replace(/"/g, '""')}"`
      })
      csvRows.push(row.join(','))
    }
    const csvData = csvRows.join('\n')
    const result = await dialog.showSaveDialog({
      title: 'Export as CSV',
      defaultPath: `StealthNode_Export_${new Date().toISOString().split('T')[0]}.csv`,
      filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    })
    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, csvData, 'utf-8')
      return { success: true, path: result.filePath, count: entries.length }
    }
    return { success: false }
  })

  // ─── Import ─────────────────────────────────────────
  ipcMain.handle('import:json', async (_e) => {
    const result = await dialog.showOpenDialog({
      title: 'Import from JSON',
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
      properties: ['openFile']
    })
    if (!result.canceled && result.filePaths[0]) {
      const jsonString = fs.readFileSync(result.filePaths[0], 'utf-8')
      const parsed = JSON.parse(jsonString)
      const entries = parsed.entries || (Array.isArray(parsed) ? parsed : [])
      const entryArray = Array.isArray(entries) ? entries : Object.values(entries)
      db.importEntries(entryArray)
      return { success: true, count: entryArray.length }
    }
    return { success: false }
  })

  ipcMain.handle('import:csv', async (_e) => {
    const result = await dialog.showOpenDialog({
      title: 'Import from CSV',
      filters: [{ name: 'CSV Files', extensions: ['csv'] }],
      properties: ['openFile']
    })
    if (!result.canceled && result.filePaths[0]) {
      const csvData = fs.readFileSync(result.filePaths[0], 'utf-8')
      const lines = csvData.split('\n').filter(l => l.trim())
      if (lines.length < 2) return { success: false, error: 'Empty CSV file' }
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
      const entries: any[] = []
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].match(/("([^"]*("")*)*"|[^,]*)/g) || []
        const entry: any = { category: 'password' }
        headers.forEach((h, idx) => {
          const val = (vals[idx] || '').replace(/^"|"$/g, '').replace(/""/g, '"')
          if (val) entry[h] = val
        })
        if (entry.title || entry.username || entry.password) {
          entries.push(entry)
        }
      }
      db.importEntries(entries)
      return { success: true, count: entries.length }
    }
    return { success: false }
  })
}
