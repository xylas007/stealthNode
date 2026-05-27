// ═══════════════════════════════════════════════════════════
// StealthNode — Master Password Prompt (Security Gate)
// Used before: edit, delete, change password, backup, restore, etc.
// ═══════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../store/appStore'

interface Props {
  title: string
  description: string
  warningText?: string
  confirmLabel?: string
  isDangerous?: boolean
  onConfirm: (password: string) => void
  onCancel: () => void
}

export default function MasterPasswordPrompt({
  title, description, warningText, confirmLabel = 'Confirm', isDangerous = false, onConfirm, onCancel
}: Props) {
  const { theme, addToast } = useAppStore()
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  async function handleVerify() {
    if (!password.trim()) { addToast({ type: 'warning', title: 'Enter your master password' }); return }
    setVerifying(true)
    try {
      const valid = await window.stealthNode.verifyPassword(password)
      if (valid) {
        onConfirm(password)
      } else {
        setShake(true)
        setTimeout(() => setShake(false), 500)
        addToast({ type: 'error', title: 'Incorrect password', message: 'Please try again' })
        setPassword('')
        inputRef.current?.focus()
      }
    } catch (e: any) {
      addToast({ type: 'error', title: 'Error', message: e.message })
    }
    setVerifying(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleVerify()
    if (e.key === 'Escape') onCancel()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 500, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onCancel}>
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-secondary)', border: `1px solid ${isDangerous ? 'rgba(244,63,94,0.4)' : 'var(--border)'}`,
          borderRadius: 20, width: 420, overflow: 'hidden',
          boxShadow: isDangerous
            ? '0 24px 80px rgba(244,63,94,0.15), 0 4px 20px rgba(0,0,0,0.4)'
            : '0 24px 80px rgba(0,0,0,0.4), 0 4px 20px rgba(0,0,0,0.3)'
        }}>

        {/* Security visual */}
        <div style={{
          padding: '24px 24px 16px', textAlign: 'center',
          background: isDangerous
            ? 'linear-gradient(180deg, rgba(244,63,94,0.08) 0%, transparent 100%)'
            : `linear-gradient(180deg, ${theme.accentMuted} 0%, transparent 100%)`
        }}>
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ fontSize: 40, marginBottom: 12 }}>
            {isDangerous ? '⚠️' : '🔐'}
          </motion.div>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{title}</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{description}</p>
        </div>

        {/* Warning */}
        {warningText && (
          <div style={{
            margin: '0 20px', padding: '10px 14px', borderRadius: 10,
            background: isDangerous ? 'rgba(244,63,94,0.1)' : 'rgba(245,158,11,0.1)',
            border: `1px solid ${isDangerous ? 'rgba(244,63,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
            fontSize: 11, color: isDangerous ? 'var(--danger)' : 'var(--warning)',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <span style={{ fontSize: 14 }}>{isDangerous ? '🚨' : '⚡'}</span>
            {warningText}
          </div>
        )}

        {/* Password Input */}
        <div style={{ padding: '16px 20px' }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6, letterSpacing: 0.5 }}>
            MASTER PASSWORD
          </label>
          <motion.div
            animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
            transition={{ duration: 0.4 }}
            style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your master password"
              style={{
                width: '100%', padding: '12px 48px 12px 14px', borderRadius: 12, fontSize: 14,
                background: 'var(--surface)', border: `1px solid ${shake ? 'var(--danger)' : 'var(--border)'}`,
                color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s',
                letterSpacing: showPw ? 'normal' : '3px'
              }}
            />
            <button onClick={() => setShowPw(!showPw)}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)'
              }}>
              {showPw ? '🙈' : '👁️'}
            </button>
          </motion.div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3" style={{ padding: '0 20px 20px' }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={onCancel}
            style={{
              flex: 1, padding: 12, borderRadius: 12, fontSize: 13, fontWeight: 500,
              background: 'var(--surface)', border: '1px solid var(--border)',
              cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.15s'
            }}>
            Cancel
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleVerify}
            disabled={verifying || !password.trim()}
            style={{
              flex: 2, padding: 12, borderRadius: 12, fontSize: 13, fontWeight: 600,
              background: !password.trim() ? 'var(--surface)' : isDangerous ? 'var(--danger)' : theme.accent,
              border: 'none', cursor: password.trim() ? 'pointer' : 'not-allowed',
              color: '#fff', transition: 'all 0.15s',
              opacity: verifying ? 0.6 : 1,
              boxShadow: password.trim() ? `0 4px 16px ${isDangerous ? 'rgba(244,63,94,0.3)' : theme.accentGlow}` : 'none'
            }}>
            {verifying ? '🔄 Verifying...' : `🔓 ${confirmLabel}`}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
