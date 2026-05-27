// ═══════════════════════════════════════════════════════════
// StealthNode — JSON File-Based Database Layer
// No native modules or WASM required — pure Node.js
// ═══════════════════════════════════════════════════════════

import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { DEFAULT_SETTINGS } from '../../shared/constants'
import type { AppSettings, Profile } from '../../shared/types'

let appDataDir = ''
let profilesData: { profiles: Record<string, any> } = { profiles: {} }
let vaultData: { entries: Record<string, any>, collections: Record<string, any>, settings: any } | null = null
let currentProfileId: string | null = null

const TRASH_RETENTION_DAYS = 60

function profilesPath() { return path.join(appDataDir, 'profiles.json') }
function vaultPath(pid: string) { return path.join(appDataDir, 'profiles', pid, 'db', 'vault.json') }
function filesDir(pid: string) { return path.join(appDataDir, 'profiles', pid, 'files') }

function loadJSON(p: string, fallback: any) {
  try { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : fallback }
  catch { return fallback }
}
function saveJSON(p: string, data: any) {
  const dir = path.dirname(p)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8')
}

// ─── Init ──────────────────────────────────────────────────
export async function initDatabase(dataDir: string) {
  appDataDir = dataDir
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  profilesData = loadJSON(profilesPath(), { profiles: {} })
}

export function closeDatabase() {
  if (currentProfileId && vaultData) saveJSON(vaultPath(currentProfileId), vaultData)
  saveJSON(profilesPath(), profilesData)
}

export async function openVaultDatabase(profileId: string) {
  if (currentProfileId && vaultData) saveJSON(vaultPath(currentProfileId), vaultData)
  const profileDir = path.join(appDataDir, 'profiles', profileId)
  for (const d of ['db', 'backups/auto', 'backups/manual', 'exports', 'assets', 'files'])
    fs.mkdirSync(path.join(profileDir, d), { recursive: true })

  vaultData = loadJSON(vaultPath(profileId), { entries: {}, collections: {}, settings: DEFAULT_SETTINGS })
  currentProfileId = profileId

  // Ensure Uncategorized collection
  if (!vaultData!.collections['uncategorized']) {
    vaultData!.collections['uncategorized'] = {
      id: 'uncategorized', profileId, name: 'Uncategorized', icon: '📁',
      iconColor: '#5A5A72', parentId: null, sortOrder: 999, createdAt: new Date().toISOString()
    }
  }

  // Auto-purge trash older than 60 days
  purgeOldTrash()

  saveJSON(vaultPath(profileId), vaultData)
}

export function closeVaultDatabase() {
  if (currentProfileId && vaultData) saveJSON(vaultPath(currentProfileId), vaultData)
  vaultData = null; currentProfileId = null
}

function saveProfiles() { saveJSON(profilesPath(), profilesData) }
function saveVault() { if (currentProfileId && vaultData) saveJSON(vaultPath(currentProfileId), vaultData) }

// ─── Trash Auto-Purge ──────────────────────────────────────
function purgeOldTrash() {
  if (!vaultData) return
  const now = Date.now()
  const cutoff = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000
  for (const [id, entry] of Object.entries(vaultData.entries) as [string, any][]) {
    if (entry.isDeleted && entry.deletedAt) {
      const deletedTime = new Date(entry.deletedAt).getTime()
      if (now - deletedTime > cutoff) {
        // Clean up associated files
        if (entry.files && Array.isArray(entry.files)) {
          for (const f of entry.files) {
            if (f.storedPath && fs.existsSync(f.storedPath)) {
              try { fs.unlinkSync(f.storedPath) } catch {}
            }
          }
        }
        delete vaultData.entries[id]
      }
    }
  }
}

// ─── Profile CRUD ──────────────────────────────────────────
export function getAllProfiles(): Profile[] {
  return Object.values(profilesData.profiles)
    .sort((a: any, b: any) => (b.lastUnlockedAt || '').localeCompare(a.lastUnlockedAt || ''))
}

export function getProfile(id: string): Profile | null {
  return profilesData.profiles[id] || null
}

export function createProfile(data: any): Profile {
  const id = uuidv4()
  const profile: Profile = {
    id, name: data.name, avatarType: data.avatarType,
    avatarEmoji: data.avatarEmoji || null, avatarInitials: data.avatarInitials || null,
    avatarGradientFrom: data.avatarGradientFrom, avatarGradientTo: data.avatarGradientTo,
    createdAt: new Date().toISOString(), lastUnlockedAt: null,
    passwordHash: data.passwordHash, salt: data.salt,
    securityQuestions: data.securityQuestions,
    lockoutUntil: null, failedAttempts: 0
  }
  profilesData.profiles[id] = profile
  saveProfiles()
  return profile
}

export function updateProfile(id: string, data: any) {
  if (!profilesData.profiles[id]) return
  Object.assign(profilesData.profiles[id], data)
  saveProfiles()
}

export function deleteProfileFromDb(id: string) {
  delete profilesData.profiles[id]
  saveProfiles()
  const dir = path.join(appDataDir, 'profiles', id)
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true })
}

// ─── Entry CRUD ────────────────────────────────────────────
export function getAllEntries(cat?: string, folderId?: string): any[] {
  if (!vaultData) return []
  let entries = Object.values(vaultData.entries).filter((e: any) => !e.isDeleted)
  if (cat) entries = entries.filter((e: any) => e.category === cat)
  if (folderId) entries = entries.filter((e: any) => e.folderId === folderId)
  return entries.sort((a: any, b: any) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
}

// Get only trash entries
export function getTrashEntries(): any[] {
  if (!vaultData) return []
  return Object.values(vaultData.entries)
    .filter((e: any) => e.isDeleted)
    .sort((a: any, b: any) => (b.deletedAt || '').localeCompare(a.deletedAt || ''))
}

export function getEntryById(id: string) {
  if (!vaultData) return null
  const e = vaultData.entries[id]
  if (e) { e.lastAccessedAt = new Date().toISOString(); saveVault() }
  return e || null
}

export function createEntryInDb(data: any) {
  if (!vaultData) throw new Error('Vault not open')
  const id = uuidv4(), now = new Date().toISOString()
  const entry = { ...data, id, profileId: currentProfileId, createdAt: now, updatedAt: now, lastAccessedAt: now, copyCount: 0, isDeleted: false, deletedAt: null }
  vaultData.entries[id] = entry
  saveVault()
  return entry
}

export function updateEntryInDb(id: string, data: any) {
  if (!vaultData || !vaultData.entries[id]) return null
  Object.assign(vaultData.entries[id], data, { updatedAt: new Date().toISOString() })
  saveVault()
  return vaultData.entries[id]
}

// Soft delete: moves to trash
export function deleteEntryFromDb(id: string) {
  if (!vaultData || !vaultData.entries[id]) return
  vaultData.entries[id].isDeleted = true
  vaultData.entries[id].deletedAt = new Date().toISOString()
  saveVault()
}

// Restore from trash
export function restoreEntryFromDb(id: string) {
  if (!vaultData || !vaultData.entries[id]) return
  vaultData.entries[id].isDeleted = false
  vaultData.entries[id].deletedAt = null
  saveVault()
}

// Permanent delete
export function hardDeleteEntryFromDb(id: string) {
  if (!vaultData) return
  const entry = vaultData.entries[id]
  if (entry && entry.files && Array.isArray(entry.files)) {
    for (const f of entry.files) {
      if (f.storedPath && fs.existsSync(f.storedPath)) {
        try { fs.unlinkSync(f.storedPath) } catch {}
      }
    }
  }
  delete vaultData.entries[id]
  saveVault()
}

export function searchEntries(q: string): any[] {
  if (!vaultData) return []
  const lower = q.toLowerCase()
  return Object.values(vaultData.entries)
    .filter((e: any) => !e.isDeleted && (e.title?.toLowerCase().includes(lower) || e.notes?.toLowerCase().includes(lower) || JSON.stringify(e).toLowerCase().includes(lower)))
    .sort((a: any, b: any) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
}

export function incrementCopyCount(id: string) {
  if (!vaultData?.entries[id]) return
  vaultData.entries[id].copyCount = (vaultData.entries[id].copyCount || 0) + 1
  saveVault()
}

// ─── Collection CRUD ───────────────────────────────────────
export function getAllCollections(): any[] {
  if (!vaultData) return []
  return Object.values(vaultData.collections).sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
}

export function createCollectionInDb(data: any) {
  if (!vaultData) throw new Error('Vault not open')
  const id = uuidv4()
  const col = { id, profileId: currentProfileId, name: data.name, icon: data.icon || '📁',
    iconColor: data.iconColor || '#7C6EFF', parentId: data.parentId || null, sortOrder: 0, createdAt: new Date().toISOString() }
  vaultData.collections[id] = col
  saveVault()
  return col
}

export function updateCollectionInDb(id: string, data: any) {
  if (!vaultData?.collections[id]) return
  Object.assign(vaultData.collections[id], data)
  saveVault()
}

export function deleteCollectionFromDb(id: string) {
  if (!vaultData) return
  // Move entries to uncategorized
  for (const e of Object.values(vaultData.entries) as any[]) {
    if (e.folderId === id) e.folderId = 'uncategorized'
  }
  delete vaultData.collections[id]
  saveVault()
}

// ─── Settings ──────────────────────────────────────────────
export function getSettings(profileId: string): AppSettings {
  if (!vaultData) return DEFAULT_SETTINGS as AppSettings
  return { ...DEFAULT_SETTINGS, ...(vaultData.settings || {}) }
}

export function updateSettingsInDb(profileId: string, data: any) {
  if (!vaultData) return
  vaultData.settings = { ...getSettings(profileId), ...data }
  saveVault()
}

// ─── File Storage ──────────────────────────────────────────
export function storeFile(filePath: string): { id: string, originalName: string, mimeType: string, size: number, storedPath: string } {
  if (!currentProfileId) throw new Error('No active profile')
  const fDir = filesDir(currentProfileId)
  if (!fs.existsSync(fDir)) fs.mkdirSync(fDir, { recursive: true })

  const fileId = uuidv4()
  const originalName = path.basename(filePath)
  const ext = path.extname(originalName)
  const destPath = path.join(fDir, `${fileId}${ext}`)

  fs.copyFileSync(filePath, destPath)

  const stats = fs.statSync(destPath)
  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.bmp': 'image/bmp', '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf', '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain', '.csv': 'text/csv', '.json': 'application/json', '.xml': 'application/xml',
    '.zip': 'application/zip', '.rar': 'application/x-rar-compressed'
  }
  const mimeType = mimeMap[ext.toLowerCase()] || 'application/octet-stream'

  return { id: fileId, originalName, mimeType, size: stats.size, storedPath: destPath }
}

export function getStoredFilePath(fileId: string): string | null {
  if (!currentProfileId) return null
  const fDir = filesDir(currentProfileId)
  if (!fs.existsSync(fDir)) return null
  const files = fs.readdirSync(fDir)
  const match = files.find(f => f.startsWith(fileId))
  return match ? path.join(fDir, match) : null
}

export function deleteStoredFile(storedPath: string) {
  if (storedPath && fs.existsSync(storedPath)) {
    try { fs.unlinkSync(storedPath) } catch {}
  }
}

// ─── Backup & Restore ──────────────────────────────────────
export function createBackupJson(): string {
  if (!vaultData || !currentProfileId) throw new Error('No vault open')
  const backupData = {
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    profileId: currentProfileId,
    entries: vaultData.entries,
    collections: vaultData.collections,
    settings: vaultData.settings
  }
  return JSON.stringify(backupData, null, 2)
}

export function restoreBackupJson(jsonString: string) {
  if (!vaultData || !currentProfileId) throw new Error('No vault open')
  const backup = JSON.parse(jsonString)
  if (!backup.entries || !backup.collections) throw new Error('Invalid backup file')
  
  vaultData.entries = { ...vaultData.entries, ...backup.entries }
  vaultData.collections = { ...vaultData.collections, ...backup.collections }
  if (backup.settings) {
    vaultData.settings = { ...vaultData.settings, ...backup.settings }
  }
  saveVault()
}

// ─── Export ────────────────────────────────────────────────
export function exportAllEntries(): any[] {
  if (!vaultData) return []
  return Object.values(vaultData.entries).filter((e: any) => !e.isDeleted)
}

// ─── Import ────────────────────────────────────────────────
export function importEntries(entries: any[]) {
  if (!vaultData || !currentProfileId) throw new Error('No vault open')
  const now = new Date().toISOString()
  for (const entry of entries) {
    const id = uuidv4()
    vaultData.entries[id] = {
      ...entry,
      id,
      profileId: currentProfileId,
      createdAt: entry.createdAt || now,
      updatedAt: now,
      lastAccessedAt: now,
      copyCount: 0,
      isDeleted: false,
      deletedAt: null
    }
  }
  saveVault()
}

export function getCurrentProfileId() { return currentProfileId }
export function getAppDataDir() { return appDataDir }
