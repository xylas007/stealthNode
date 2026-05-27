// ═══════════════════════════════════════════════════════════
// StealthNode — Profile Selection Screen
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../store/appStore'
import { THEMES } from '../../shared/constants'
import type { Profile } from '../../shared/types'
import { DottedSurface } from '../components/Common/DottedSurface'

export default function ProfileSelect() {
  const { setView, setTheme, theme, addToast } = useAppStore()
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProfile, setSelectedProfile] = useState<any>(null)

  useEffect(() => {
    loadProfiles()
  }, [])

  async function loadProfiles() {
    try {
      const p = await window.stealthNode.getProfiles()
      setProfiles(p || [])
    } catch { setProfiles([]) }
    setLoading(false)
  }

  function handleProfileClick(profile: any) {
    setSelectedProfile(profile)
    useAppStore.setState({ activeProfileId: profile.id, activeProfile: profile })
    setTimeout(() => setView('unlock'), 150)
  }

  function toggleTheme() {
    const isDark = theme.isDark
    const target = isDark ? THEMES.find(t => !t.isDark) : THEMES.find(t => t.isDark)
    if (target) setTheme(target.id)
  }

  function timeAgo(date: string | null): string {
    if (!date) return 'Never used'
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    return `${Math.floor(days / 30)}mo ago`
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">

      <DottedSurface className="absolute inset-0 z-0 opacity-70" />

      {/* Background glow */}
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 500, borderRadius: '50%', background: 'var(--accent-glow)',
        filter: 'blur(120px)', opacity: 0.15, pointerEvents: 'none' }} />

      {/* Theme Toggle */}
      <motion.button
        className="titlebar-no-drag"
        onClick={toggleTheme}
        whileHover={{ scale: 1.1, rotate: 15 }}
        whileTap={{ scale: 0.9 }}
        style={{ position: 'absolute', top: 16, right: 20, background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: 12, width: 40, height: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          fontSize: 18, zIndex: 10 }}
      >
        {theme.isDark ? '☀️' : '🌙'}
      </motion.button>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col items-center mb-10"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
        >
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none">
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={theme.accent}/>
                <stop offset="100%" stopColor={theme.accent + 'AA'}/>
              </linearGradient>
              <filter id="logoGlow">
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
              </filter>
            </defs>
            <path d="M12 2L4 6v5c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z"
              fill="url(#logoGrad)" filter="url(#logoGlow)"/>
            <circle cx="12" cy="10" r="2.5" fill={theme.isDark ? theme.bgPrimary : '#fff'}/>
            <rect x="10.8" y="12.5" width="2.4" height="3.5" rx="1.2" fill={theme.isDark ? theme.bgPrimary : '#fff'}/>
          </svg>
        </motion.div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '2px', marginTop: 12,
          ...(theme.isDark ? {
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}AA)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          } : { color: theme.textPrimary }) }}>
          STEALTHNODE
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
          Your secrets. Encrypted. Always.
        </p>
      </motion.div>

      {/* Profile Cards */}
      <div className="flex flex-wrap justify-center gap-5" style={{ maxWidth: 700, padding: '0 24px' }}>
        {profiles.map((profile, i) => (
          <motion.button
            key={profile.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            whileHover={{ y: -4, boxShadow: `0 12px 40px ${theme.accent}20` }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleProfileClick(profile)}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 20, padding: '28px 24px', width: 200,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              cursor: 'pointer', transition: 'border-color 0.2s'
            }}
            className="hover:border-accent/30"
          >
            <div style={{
              width: 56, height: 56, borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 28,
              background: `linear-gradient(135deg, ${profile.avatarGradientFrom}, ${profile.avatarGradientTo})`
            }}>
              {profile.avatarType === 'emoji' ? profile.avatarEmoji : (
                <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{profile.avatarInitials}</span>
              )}
            </div>
            <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{profile.name}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Last used: {timeAgo(profile.lastUnlockedAt)}
            </span>
          </motion.button>
        ))}

        {/* Add Profile Card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: profiles.length * 0.1, duration: 0.4 }}
          whileHover={{ y: -4, background: 'var(--accent-muted)' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setView('create-profile')}
          style={{
            background: 'transparent', border: '2px dashed var(--border)',
            borderRadius: 20, padding: '28px 24px', width: 200,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            cursor: 'pointer', transition: 'all 0.25s'
          }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: '50%', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 28,
            border: '2px dashed var(--text-muted)', color: 'var(--text-muted)'
          }}>+</div>
          <span style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-secondary)' }}>Create New Profile</span>
        </motion.button>
      </div>

      {/* Footer branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        style={{ position: 'absolute', bottom: 20, color: 'var(--text-muted)', fontSize: 11 }}
      >
        Made by XYLAS · v1.1.6
      </motion.div>
    </div>
  )
}
