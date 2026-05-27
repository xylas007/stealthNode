// ═══════════════════════════════════════════════════════════
// StealthNode — Shared Type Definitions
// ═══════════════════════════════════════════════════════════

// ─── Profile ───────────────────────────────────────────────

export interface Profile {
  id: string
  name: string
  avatarType: 'emoji' | 'initials'
  avatarEmoji?: string
  avatarInitials?: string
  avatarGradientFrom: string
  avatarGradientTo: string
  createdAt: string
  lastUnlockedAt: string | null
  passwordHash: string
  salt: string
  securityQuestions: SecurityQuestion[]
  lockoutUntil: string | null
  failedAttempts: number
}

export interface SecurityQuestion {
  question: string
  answerHash: string
}

// ─── Vault Entry Base ──────────────────────────────────────

export type EntryCategory =
  | 'password'
  | 'note'
  | 'image'
  | 'document'
  | 'code'
  | 'token'
  | 'backup-code'
  | 'legal'
  | 'bank'
  | 'weblink'

export interface VaultEntryBase {
  id: string
  profileId: string
  category: EntryCategory
  title: string
  folderId: string | null
  isFavorite: boolean
  createdAt: string
  updatedAt: string
  lastAccessedAt: string
  copyCount: number
  notes?: string
}

// ─── Specific Entry Types ──────────────────────────────────

export interface PasswordEntry extends VaultEntryBase {
  category: 'password'
  websiteUrl?: string
  faviconUrl?: string
  username?: string
  email?: string
  encryptedPassword: string
  passwordIv: string
  backupCodes?: string
}

export interface NoteEntry extends VaultEntryBase {
  category: 'note'
  encryptedContent: string
  contentIv: string
}

export interface ImageEntry extends VaultEntryBase {
  category: 'image'
  files: StoredFile[]
}

export interface DocumentEntry extends VaultEntryBase {
  category: 'document'
  files: StoredFile[]
}

export interface CodeEntry extends VaultEntryBase {
  category: 'code'
  language: string
  encryptedCode: string
  codeIv: string
  description?: string
}

export interface TokenEntry extends VaultEntryBase {
  category: 'token'
  serviceName: string
  encryptedToken: string
  tokenIv: string
  tokenType: string
  expiryDate?: string
}

export interface BackupCodeEntry extends VaultEntryBase {
  category: 'backup-code'
  associatedEmail: string
  codes: BackupCode[]
  serviceUrl?: string
}

export interface BackupCode {
  code: string
  isUsed: boolean
}

export interface LegalEntry extends VaultEntryBase {
  category: 'legal'
  documentType: string
  files: StoredFile[]
  issueDate?: string
  expiryDate?: string
  issuedBy?: string
}

export interface BankEntry extends VaultEntryBase {
  category: 'bank'
  accountType: string
  bankName: string
  accountHolderName: string
  encryptedAccountNumber?: string
  accountNumberIv?: string
  ifscCode?: string
  encryptedCardNumber?: string
  cardNumberIv?: string
  cardExpiry?: string
  encryptedCvv?: string
  cvvIv?: string
  encryptedPin?: string
  pinIv?: string
  encryptedNetBankingUser?: string
  netBankingUserIv?: string
  encryptedNetBankingPass?: string
  netBankingPassIv?: string
  upiId?: string
  files: StoredFile[]
}

export interface WebLinkEntry extends VaultEntryBase {
  category: 'weblink'
  url: string
  faviconUrl?: string
  description?: string
  tags?: string
}

export type VaultEntry =
  | PasswordEntry
  | NoteEntry
  | ImageEntry
  | DocumentEntry
  | CodeEntry
  | TokenEntry
  | BackupCodeEntry
  | LegalEntry
  | BankEntry
  | WebLinkEntry

// ─── Stored File ───────────────────────────────────────────

export interface StoredFile {
  id: string
  originalName: string
  mimeType: string
  size: number
  storedPath: string
}

// ─── Collections ───────────────────────────────────────────

export interface Collection {
  id: string
  profileId: string
  name: string
  icon: string
  iconColor: string
  parentId: string | null
  sortOrder: number
  createdAt: string
}

// ─── Theme ─────────────────────────────────────────────────

export interface ThemeDefinition {
  id: string
  name: string
  description: string
  isDark: boolean
  accent: string
  accentMuted: string
  accentGlow: string
  bgPrimary: string
  bgSecondary: string
  bgTertiary: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  border: string
  danger: string
  warning: string
  success: string
  surface: string
  surfaceHover: string
}

// ─── Settings ──────────────────────────────────────────────

export interface AppSettings {
  themeId: string
  fontFamily: string
  uiDensity: 'compact' | 'comfortable'
  animationsEnabled: boolean
  autoLockTimeout: number // minutes, 0 = never
  launchAtStartup: boolean
  minimizeToTray: boolean
  clipboardClearDuration: number // seconds, 0 = never
  autoBackupOnLogin: boolean
  autoBackupInterval: number // minutes
  maxAutoBackups: number
  sidebarCollapsed: boolean
}

// ─── Notification ──────────────────────────────────────────

export interface ToastNotification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

// ─── Session ───────────────────────────────────────────────

export interface SessionState {
  isUnlocked: boolean
  activeProfileId: string | null
  activeProfile: Profile | null
  lastActivityAt: number
  lockoutUntil: number | null
}

// ─── Filter ────────────────────────────────────────────────

export type FilterType = 'all' | 'favorites' | 'recent' | 'weak' | 'expired'
export type ViewMode = 'grid' | 'list'
