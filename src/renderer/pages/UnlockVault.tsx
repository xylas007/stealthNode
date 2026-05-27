// StealthNode — Unlock Vault Screen
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../store/appStore'
import { DottedSurface } from '../components/Common/DottedSurface'

export default function UnlockVault() {
  const { activeProfileId, activeProfile, setView, setUnlocked, addToast, theme } = useAppStore()
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    if (!password || !activeProfileId) return
    setLoading(true); setError('')
    try {
      const result = await window.stealthNode.unlockVault(activeProfileId, password)
      if (result.success) {
        setUnlocked(true, activeProfileId, activeProfile)
        addToast({ type: 'success', title: 'Vault unlocked', message: `Welcome back, ${activeProfile?.name}!` })
      } else {
        setError(result.error || 'Incorrect password')
        setShake(true); setTimeout(() => setShake(false), 500)
      }
    } catch (e: any) { setError(e.message || 'Unlock failed') }
    setLoading(false)
  }

  const profile = activeProfile
  const gradient = profile ? `linear-gradient(135deg, ${profile.avatarGradientFrom}, ${profile.avatarGradientTo})` : theme.accent

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
      <DottedSurface className="absolute inset-0 z-0 opacity-70" />
      <div style={{ position: 'absolute', top: '25%', left: '50%', transform: 'translateX(-50%)',
        width: 400, height: 400, borderRadius: '50%', background: 'var(--accent-glow)',
        filter: 'blur(100px)', opacity: 0.12, pointerEvents: 'none' }} />

      <button onClick={() => setView('profiles')}
        style={{ position: 'absolute', top: 16, left: 20, background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: 10, padding: '6px 14px',
          color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>
        ← Profiles
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-6" style={{ width: 360 }}>

        {/* Avatar */}
        <motion.div animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}} transition={{ duration: 0.4 }}
          style={{ width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 40, background: gradient, boxShadow: `0 8px 32px ${theme.accent}30` }}>
          {profile?.avatarType === 'emoji' ? profile.avatarEmoji : (
            <span style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{profile?.avatarInitials}</span>
          )}
        </motion.div>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>{profile?.name}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Enter your master password to unlock</p>
        </div>

        <form onSubmit={handleUnlock} className="flex flex-col gap-4 w-full">
          <div style={{ position: 'relative' }}>
            <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Master password" autoFocus disabled={loading}
              style={{ width: '100%', padding: '14px 50px 14px 18px', borderRadius: 14, fontSize: 15,
                background: 'var(--surface)', border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
                color: 'var(--text-primary)', outline: 'none' }} />
            <button type="button" onClick={() => setShowPw(!showPw)}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>

          {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center' }}>{error}</motion.p>}

          <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            disabled={!password || loading}
            style={{ padding: '14px', borderRadius: 14, fontSize: 15, fontWeight: 600,
              background: password ? theme.accent : 'var(--surface)',
              color: password ? '#fff' : 'var(--text-muted)',
              border: 'none', cursor: password ? 'pointer' : 'not-allowed',
              opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Unlocking...' : '🔓 Unlock Vault'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
