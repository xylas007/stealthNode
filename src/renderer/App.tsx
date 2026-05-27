// ═══════════════════════════════════════════════════════════
// StealthNode — Main App Component
// ═══════════════════════════════════════════════════════════

import React, { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from './store/appStore'
import TitleBar from './components/Layout/TitleBar'
import ProfileSelect from './pages/ProfileSelect'
import ProfileCreate from './pages/ProfileCreate'
import UnlockVault from './pages/UnlockVault'
import VaultMain from './pages/VaultMain'
import SettingsPage from './pages/SettingsPage'
import ToastContainer from './components/Common/ToastContainer'

export default function App() {
  const { currentView, theme, applyThemeToDOM } = useAppStore()

  useEffect(() => {
    applyThemeToDOM(theme)
    window.stealthNode?.onWindowStateChanged?.((isMax: boolean) => {
      useAppStore.getState().setIsMaximized(isMax)
    })
    window.stealthNode?.onVaultLockRequested?.(() => {
      useAppStore.getState().lockVault()
    })
    window.stealthNode?.onClipboardCleared?.(() => {
      useAppStore.getState().addToast({ type: 'info', title: 'Clipboard cleared' })
    })
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'l') { e.preventDefault(); if (useAppStore.getState().isUnlocked) useAppStore.getState().lockVault() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const renderView = () => {
    switch (currentView) {
      case 'profiles': return <ProfileSelect key="profiles" />
      case 'create-profile': return <ProfileCreate key="create" />
      case 'unlock': return <UnlockVault key="unlock" />
      case 'vault': return <VaultMain key="vault" />
      case 'settings': return <SettingsPage key="settings" />
      default: return <ProfileSelect key="profiles" />
    }
  }

  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <TitleBar />
      <div className="flex-1 overflow-hidden relative app-body">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full h-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </div>
      <ToastContainer />
    </div>
  )
}
