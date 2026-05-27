// ═══════════════════════════════════════════════════════════
// StealthNode — App Store (Zustand)
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand'
import type { ThemeDefinition, AppSettings, ToastNotification, Profile } from '../../shared/types'
import { THEMES, DEFAULT_SETTINGS } from '../../shared/constants'

interface AppState {
  // ─── Session ──────────────────────────────────────────
  isUnlocked: boolean
  activeProfileId: string | null
  activeProfile: Profile | null
  currentView: 'profiles' | 'create-profile' | 'unlock' | 'vault' | 'settings'

  // ─── Theme ────────────────────────────────────────────
  theme: ThemeDefinition
  settings: AppSettings

  // ─── UI State ─────────────────────────────────────────
  sidebarCollapsed: boolean
  isMaximized: boolean
  showKeyboardShortcuts: boolean

  // ─── Notifications ────────────────────────────────────
  toasts: ToastNotification[]

  // ─── Actions ──────────────────────────────────────────
  setView: (view: AppState['currentView']) => void
  setUnlocked: (unlocked: boolean, profileId?: string | null, profile?: Profile | null) => void
  setTheme: (themeId: string) => void
  applyThemeToDOM: (theme: ThemeDefinition) => void
  setSettings: (settings: Partial<AppSettings>) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setIsMaximized: (max: boolean) => void
  setShowKeyboardShortcuts: (show: boolean) => void
  addToast: (toast: Omit<ToastNotification, 'id'>) => void
  removeToast: (id: string) => void
  lockVault: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  isUnlocked: false,
  activeProfileId: null,
  activeProfile: null,
  currentView: 'profiles',
  theme: THEMES[0],
  settings: DEFAULT_SETTINGS as AppSettings,
  sidebarCollapsed: false,
  isMaximized: true,
  showKeyboardShortcuts: false,
  toasts: [],

  setView: (view) => set({ currentView: view }),

  setUnlocked: (unlocked, profileId = null, profile = null) => {
    if (unlocked && profileId) {
      window.stealthNode.getSettings(profileId).then((dbSettings: any) => {
        if (dbSettings) {
          set({ settings: dbSettings })
          if (dbSettings.minimizeToTray !== undefined) {
            window.stealthNode.setMinimizeToTray(dbSettings.minimizeToTray)
          }
          const themeId = dbSettings.themeId || THEMES[0].id
          const themeObj = THEMES.find(t => t.id === themeId) || THEMES[0]
          get().applyThemeToDOM(themeObj)
          set({ theme: themeObj })
          if (dbSettings.fontFamily) {
            document.body.style.fontFamily = dbSettings.fontFamily
          }
        }
      })
    } else {
      const defaultTheme = THEMES[0]
      get().applyThemeToDOM(defaultTheme)
      set({
        theme: defaultTheme,
        settings: DEFAULT_SETTINGS as AppSettings
      })
      document.body.style.fontFamily = 'Inter'
    }
    set({
      isUnlocked: unlocked,
      activeProfileId: profileId,
      activeProfile: profile,
      currentView: unlocked ? 'vault' : 'profiles'
    })
  },

  setTheme: (themeId) => {
    const theme = THEMES.find(t => t.id === themeId) || THEMES[0]
    get().applyThemeToDOM(theme)
    set({ theme })
    const activeProfileId = get().activeProfileId
    if (activeProfileId) {
      get().setSettings({ themeId })
    }
  },

  applyThemeToDOM: (theme) => {
    const root = document.documentElement
    root.style.setProperty('--accent', theme.accent)
    root.style.setProperty('--accent-muted', theme.accentMuted)
    root.style.setProperty('--accent-glow', theme.accentGlow)
    root.style.setProperty('--bg-primary', theme.bgPrimary)
    root.style.setProperty('--bg-secondary', theme.bgSecondary)
    root.style.setProperty('--bg-tertiary', theme.bgTertiary)
    root.style.setProperty('--text-primary', theme.textPrimary)
    root.style.setProperty('--text-secondary', theme.textSecondary)
    root.style.setProperty('--text-muted', theme.textMuted)
    root.style.setProperty('--border', theme.border)
    root.style.setProperty('--danger', theme.danger)
    root.style.setProperty('--warning', theme.warning)
    root.style.setProperty('--success', theme.success)
    root.style.setProperty('--surface', theme.surface)
    root.style.setProperty('--surface-hover', theme.surfaceHover)
    document.body.style.background = theme.bgPrimary
  },

  setSettings: (newSettings) => {
    set(state => {
      const updated = { ...state.settings, ...newSettings }
      if (state.activeProfileId) {
        window.stealthNode.updateSettings(state.activeProfileId, updated)
      }
      if (newSettings.minimizeToTray !== undefined) {
        window.stealthNode.setMinimizeToTray(newSettings.minimizeToTray)
      }
      return { settings: updated }
    })
  },

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setIsMaximized: (max) => set({ isMaximized: max }),
  setShowKeyboardShortcuts: (show) => set({ showKeyboardShortcuts: show }),

  addToast: (toast) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
    set(state => ({ toasts: [...state.toasts, { ...toast, id }] }))
    setTimeout(() => get().removeToast(id), toast.duration || 4000)
  },

  removeToast: (id) => set(state => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),

  lockVault: () => {
    window.stealthNode?.lockVault()
    get().setUnlocked(false)
  }
}))
