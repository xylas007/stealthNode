// ═══════════════════════════════════════════════════════════
// StealthNode — Shared Constants
// ═══════════════════════════════════════════════════════════

import type { ThemeDefinition, EntryCategory } from './types'

// ─── App Info ──────────────────────────────────────────────

export const APP_NAME = 'StealthNode'
export const APP_VERSION = '1.0.0'
export const APP_ID = 'com.xylas007.stealthnode'
export const AUTHOR = 'xylas007'
export const GITHUB_URL = 'https://github.com/xylas007'
export const PATREON_URL = 'https://www.patreon.com/c/xylascode'

// ─── Crypto Constants ──────────────────────────────────────

export const ARGON2_CONFIG = {
  memoryCost: 65536, // 64MB
  timeCost: 3,
  parallelism: 4,
  hashLength: 32
}

export const ENCRYPTION_ALGORITHM = 'aes-256-gcm'
export const IV_LENGTH = 16
export const AUTH_TAG_LENGTH = 16
export const SALT_LENGTH = 32

// ─── Auth Constants ────────────────────────────────────────

export const MAX_PASSWORD_ATTEMPTS = 5
export const PASSWORD_LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes in ms
export const MAX_SECURITY_QUESTION_ATTEMPTS = 3
export const SECURITY_QUESTION_LOCKOUT_DURATION = 12 * 60 * 60 * 1000 // 12 hours in ms

// ─── Themes ────────────────────────────────────────────────

export const THEMES: ThemeDefinition[] = [
  {
    id: 'obsidian',
    name: 'Obsidian',
    description: 'Deep space dark',
    isDark: true,
    accent: '#7C6EFF',
    accentMuted: 'rgba(124,110,255,0.15)',
    accentGlow: 'rgba(124,110,255,0.3)',
    bgPrimary: '#0D0D12',
    bgSecondary: '#13131A',
    bgTertiary: '#1A1A24',
    textPrimary: '#F0F0F5',
    textSecondary: '#A0A0B5',
    textMuted: '#5A5A72',
    border: 'rgba(255,255,255,0.08)',
    danger: '#F43F5E',
    warning: '#F59E0B',
    success: '#10B981',
    surface: '#1A1A24',
    surfaceHover: '#22222F'
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Navy depth',
    isDark: true,
    accent: '#3B82F6',
    accentMuted: 'rgba(59,130,246,0.15)',
    accentGlow: 'rgba(59,130,246,0.3)',
    bgPrimary: '#0A0F1E',
    bgSecondary: '#0F1528',
    bgTertiary: '#151D35',
    textPrimary: '#E8ECF5',
    textSecondary: '#8B9DC3',
    textMuted: '#4A5E82',
    border: 'rgba(255,255,255,0.06)',
    danger: '#F43F5E',
    warning: '#F59E0B',
    success: '#10B981',
    surface: '#151D35',
    surfaceHover: '#1C2640'
  },
  {
    id: 'carbon',
    name: 'Carbon',
    description: 'Pure dark + green',
    isDark: true,
    accent: '#10B981',
    accentMuted: 'rgba(16,185,129,0.15)',
    accentGlow: 'rgba(16,185,129,0.3)',
    bgPrimary: '#111111',
    bgSecondary: '#171717',
    bgTertiary: '#1E1E1E',
    textPrimary: '#EAEAEA',
    textSecondary: '#999999',
    textMuted: '#555555',
    border: 'rgba(255,255,255,0.08)',
    danger: '#F43F5E',
    warning: '#F59E0B',
    success: '#10B981',
    surface: '#1E1E1E',
    surfaceHover: '#262626'
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Gradient aurora',
    isDark: true,
    accent: '#A78BFA',
    accentMuted: 'rgba(167,139,250,0.15)',
    accentGlow: 'rgba(167,139,250,0.3)',
    bgPrimary: '#0F0A1E',
    bgSecondary: '#150F28',
    bgTertiary: '#1C1535',
    textPrimary: '#F0E8FF',
    textSecondary: '#B09DD0',
    textMuted: '#6B5A88',
    border: 'rgba(255,255,255,0.07)',
    danger: '#F43F5E',
    warning: '#F59E0B',
    success: '#10B981',
    surface: '#1C1535',
    surfaceHover: '#241D42'
  },
  {
    id: 'crimson',
    name: 'Crimson',
    description: 'Dark with red accent',
    isDark: true,
    accent: '#F43F5E',
    accentMuted: 'rgba(244,63,94,0.15)',
    accentGlow: 'rgba(244,63,94,0.3)',
    bgPrimary: '#120A0D',
    bgSecondary: '#1A0F14',
    bgTertiary: '#22151B',
    textPrimary: '#F5E8EC',
    textSecondary: '#C3969F',
    textMuted: '#825A65',
    border: 'rgba(255,255,255,0.07)',
    danger: '#F43F5E',
    warning: '#F59E0B',
    success: '#10B981',
    surface: '#22151B',
    surfaceHover: '#2C1D24'
  },
  {
    id: 'slate',
    name: 'Slate',
    description: 'Warm gray',
    isDark: false,
    accent: '#6366F1',
    accentMuted: 'rgba(99,102,241,0.12)',
    accentGlow: 'rgba(99,102,241,0.25)',
    bgPrimary: '#D8DAE2',
    bgSecondary: '#E2E4EB',
    bgTertiary: '#CBCDD6',
    textPrimary: '#1A1A2E',
    textSecondary: '#3D3D5C',
    textMuted: '#6E6E8A',
    border: 'rgba(0,0,0,0.12)',
    danger: '#DC2626',
    warning: '#D97706',
    success: '#059669',
    surface: '#E8EAF0',
    surfaceHover: '#DFE1E9'
  },
  {
    id: 'cloud',
    name: 'Cloud',
    description: 'Cool blue-gray',
    isDark: false,
    accent: '#0EA5E9',
    accentMuted: 'rgba(14,165,233,0.12)',
    accentGlow: 'rgba(14,165,233,0.25)',
    bgPrimary: '#CDD5E4',
    bgSecondary: '#D8DDE8',
    bgTertiary: '#C2CADB',
    textPrimary: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#64748B',
    border: 'rgba(0,0,0,0.10)',
    danger: '#DC2626',
    warning: '#D97706',
    success: '#059669',
    surface: '#DEE3ED',
    surfaceHover: '#D4DAE6'
  },
  {
    id: 'paper',
    name: 'Paper',
    description: 'Warm stone',
    isDark: false,
    accent: '#8B5CF6',
    accentMuted: 'rgba(139,92,246,0.12)',
    accentGlow: 'rgba(139,92,246,0.25)',
    bgPrimary: '#D6D6DB',
    bgSecondary: '#E0E0E4',
    bgTertiary: '#CACACF',
    textPrimary: '#18181B',
    textSecondary: '#3F3F46',
    textMuted: '#6B6B76',
    border: 'rgba(0,0,0,0.12)',
    danger: '#DC2626',
    warning: '#D97706',
    success: '#059669',
    surface: '#E5E5EA',
    surfaceHover: '#DCDCE2'
  }
]

// ─── Font Options ──────────────────────────────────────────

export const FONT_OPTIONS = [
  { id: 'inter', name: 'Inter', family: 'Inter', description: 'Clean, modern, highly legible' },
  { id: 'geist', name: 'Geist', family: 'Geist', description: 'Developer-friendly, sharp' },
  { id: 'dm-sans', name: 'DM Sans', family: '"DM Sans"', description: 'Friendly and rounded' },
  { id: 'jakarta', name: 'Plus Jakarta Sans', family: '"Plus Jakarta Sans"', description: 'Premium SaaS feel' },
  { id: 'sora', name: 'Sora', family: 'Sora', description: 'Futuristic, techy' },
  { id: 'outfit', name: 'Outfit', family: 'Outfit', description: 'Geometric, clean' },
  { id: 'nunito', name: 'Nunito', family: 'Nunito', description: 'Rounded, approachable' },
  { id: 'lexend', name: 'Lexend', family: 'Lexend', description: 'High readability, professional' },
  { id: 'space', name: 'Space Grotesk', family: '"Space Grotesk"', description: 'Technical, unique' },
  { id: 'figtree', name: 'Figtree', family: 'Figtree', description: 'Warm, versatile' }
]

// ─── Entry Categories ──────────────────────────────────────

export interface CategoryInfo {
  id: EntryCategory
  label: string
  icon: string
  subtitle: string
  color: string
}

export const ENTRY_CATEGORIES: CategoryInfo[] = [
  { id: 'password', label: 'Password', icon: '🔐', subtitle: 'Save login credentials for a website or app', color: '#7C6EFF' },
  { id: 'note', label: 'Note', icon: '📝', subtitle: 'Store private encrypted notes or memos', color: '#F59E0B' },
  { id: 'image', label: 'Image', icon: '🖼️', subtitle: 'Save images, screenshots, or photos securely', color: '#EC4899' },
  { id: 'document', label: 'Document', icon: '📄', subtitle: 'Store PDFs, docs, CSVs, and other files', color: '#3B82F6' },
  { id: 'code', label: 'Code', icon: '💻', subtitle: 'Save code snippets with syntax context', color: '#10B981' },
  { id: 'token', label: 'Token / API Key', icon: '🔑', subtitle: 'API keys, OAuth tokens, access credentials', color: '#8B5CF6' },
  { id: 'backup-code', label: 'Backup Codes', icon: '🛡️', subtitle: '2FA recovery and backup auth codes', color: '#06B6D4' },
  { id: 'legal', label: 'Legal', icon: '⚖️', subtitle: 'Legal documents, IDs, and official images', color: '#6366F1' },
  { id: 'bank', label: 'Bank Details', icon: '🏦', subtitle: 'Financial account information and card data', color: '#14B8A6' },
  { id: 'weblink', label: 'Web Link', icon: '🔗', subtitle: 'Bookmarks and important URLs with notes', color: '#0EA5E9' }
]

// ─── Navigation Items ──────────────────────────────────────

export const NAV_ITEMS = [
  { id: 'all', label: 'All Items', icon: '🔑', category: null as EntryCategory | null },
  { id: 'password', label: 'Passwords', icon: '🔐', category: 'password' as EntryCategory },
  { id: 'note', label: 'Notes', icon: '📝', category: 'note' as EntryCategory },
  { id: 'image', label: 'Images', icon: '🖼️', category: 'image' as EntryCategory },
  { id: 'document', label: 'Documents', icon: '📄', category: 'document' as EntryCategory },
  { id: 'code', label: 'Code Snippets', icon: '💻', category: 'code' as EntryCategory },
  { id: 'token', label: 'Tokens & API Keys', icon: '🔑', category: 'token' as EntryCategory },
  { id: 'backup-code', label: 'Backup Codes', icon: '🛡️', category: 'backup-code' as EntryCategory },
  { id: 'legal', label: 'Legal', icon: '⚖️', category: 'legal' as EntryCategory },
  { id: 'bank', label: 'Bank Details', icon: '🏦', category: 'bank' as EntryCategory },
  { id: 'weblink', label: 'Web Links', icon: '🔗', category: 'weblink' as EntryCategory }
]

// ─── Security Questions ────────────────────────────────────

export const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What is your favorite movie?",
  "What street did you grow up on?",
  "What was your childhood nickname?",
  "What is the name of your favorite childhood friend?",
  "What was the make of your first car?",
  "What is your favorite book?",
  "What is the name of the hospital where you were born?",
  "What was your dream job as a child?",
  "What is the middle name of your oldest sibling?",
  "What was the first concert you attended?",
  "What is the name of your favorite teacher?",
  "What was the first dish you learned to cook?",
  "What is the last name of your favorite historical figure?",
  "What was the destination of your first flight?",
  "What is your favorite sports team?",
  "What was the name of the street you lived on in third grade?"
]

// ─── Avatars ───────────────────────────────────────────────

export const AVATAR_EMOJIS = ['🦊', '🐺', '🦁', '🐻', '🐼', '🦉', '🦅', '🐉', '🦄', '🐲', '🛡️', '⚡']

export const AVATAR_GRADIENTS = [
  { from: '#7C6EFF', to: '#A78BFA' },
  { from: '#3B82F6', to: '#60A5FA' },
  { from: '#10B981', to: '#34D399' },
  { from: '#F43F5E', to: '#FB7185' },
  { from: '#F59E0B', to: '#FBBF24' },
  { from: '#8B5CF6', to: '#A78BFA' },
  { from: '#EC4899', to: '#F472B6' },
  { from: '#06B6D4', to: '#22D3EE' },
  { from: '#6366F1', to: '#818CF8' },
  { from: '#14B8A6', to: '#2DD4BF' },
  { from: '#EF4444', to: '#F87171' },
  { from: '#84CC16', to: '#A3E635' }
]

// ─── Collection Icons ──────────────────────────────────────

export const COLLECTION_ICONS = [
  '📁', '🔒', '⭐', '❤️', '💼', '💻', '🌐', '🛡️', '🔑', '🏠',
  '🎮', '📧', '🏢', '💰', '📚', '🎨', '🔧', '📱', '☁️', '🎯'
]

export const COLLECTION_COLORS = [
  '#7C6EFF', '#3B82F6', '#10B981', '#F43F5E', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#6366F1', '#14B8A6', '#EF4444', '#84CC16'
]

// ─── Code Languages ────────────────────────────────────────

export const CODE_LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Rust', 'Go', 'Java', 'C#', 'C++', 'C',
  'SQL', 'Bash', 'PowerShell', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Dart',
  'HTML', 'CSS', 'SCSS', 'JSON', 'YAML', 'XML', 'Markdown', 'Shell',
  'R', 'Scala', 'Perl', 'Lua', 'Haskell', 'Elixir', 'Clojure'
]

// ─── Token Types ───────────────────────────────────────────

export const TOKEN_TYPES = [
  'API Key', 'OAuth Token', 'Bearer Token', 'Personal Access Token', 'Secret Key', 'Other'
]

// ─── Legal Document Types ──────────────────────────────────

export const LEGAL_DOCUMENT_TYPES = [
  'Passport', 'National ID', "Driver's License", 'Lease Agreement',
  'Insurance', 'Tax Document', 'Contract', 'Certificate', 'Other'
]

// ─── Bank Account Types ────────────────────────────────────

export const BANK_ACCOUNT_TYPES = [
  'Savings Account', 'Checking Account', 'Credit Card', 'Debit Card',
  'Investment Account', 'Crypto Wallet', 'Loan Account', 'Other'
]

// ─── Auto-Lock Options ─────────────────────────────────────

export const AUTO_LOCK_OPTIONS = [
  { label: '5 minutes', value: 5 },
  { label: '15 minutes', value: 15 },
  { label: '1 hour', value: 60 },
  { label: '4 hours', value: 240 },
  { label: 'Never', value: 0 }
]

// ─── Clipboard Clear Options ───────────────────────────────

export const CLIPBOARD_CLEAR_OPTIONS = [
  { label: '15 seconds', value: 15 },
  { label: '30 seconds', value: 30 },
  { label: '60 seconds', value: 60 },
  { label: 'Never', value: 0 }
]

// ─── Default Settings ──────────────────────────────────────

export const DEFAULT_SETTINGS = {
  themeId: 'obsidian',
  fontFamily: 'Inter',
  uiDensity: 'comfortable' as const,
  animationsEnabled: true,
  autoLockTimeout: 5,
  launchAtStartup: false,
  minimizeToTray: false,
  clipboardClearDuration: 30,
  autoBackupOnLogin: true,
  autoBackupInterval: 10,
  maxAutoBackups: 5,
  sidebarCollapsed: false
}

// ─── Keyboard Shortcuts ────────────────────────────────────

export const KEYBOARD_SHORTCUTS = [
  { key: 'Ctrl + F', action: 'Focus search bar' },
  { key: 'Ctrl + N', action: 'Add new entry' },
  { key: 'Ctrl + L', action: 'Lock vault' },
  { key: 'Ctrl + /', action: 'Show keyboard shortcuts' },
  { key: 'Ctrl + ,', action: 'Open settings' },
  { key: 'Ctrl + B', action: 'Toggle sidebar' },
  { key: 'Escape', action: 'Close modal / Clear search' },
  { key: 'Ctrl + 1-9', action: 'Switch category' }
]
