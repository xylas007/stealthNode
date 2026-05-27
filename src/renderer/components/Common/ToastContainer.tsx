// ═══════════════════════════════════════════════════════════
// StealthNode — Toast Notification Container
// ═══════════════════════════════════════════════════════════

import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '../../store/appStore'

const ICONS: Record<string, string> = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }
const COLORS: Record<string, string> = {
  success: 'var(--success)', error: 'var(--danger)',
  warning: 'var(--warning)', info: 'var(--accent)'
}

export default function ToastContainer() {
  const { toasts, removeToast } = useAppStore()

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={() => removeToast(toast.id)}
            style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderLeft: `3px solid ${COLORS[toast.type]}`,
              borderRadius: 12, padding: '12px 16px', minWidth: 280, maxWidth: 380,
              display: 'flex', alignItems: 'flex-start', gap: 10,
              cursor: 'pointer', pointerEvents: 'auto',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}
          >
            <span style={{ fontSize: 16 }}>{ICONS[toast.type]}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{toast.title}</div>
              {toast.message && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{toast.message}</div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
