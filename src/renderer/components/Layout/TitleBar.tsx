// ═══════════════════════════════════════════════════════════
// StealthNode — Custom Title Bar (theme-aware)
// FIX: Only the center spacer is draggable, not the whole bar.
// ═══════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../../store/appStore'

// Electron needs -webkit-app-region which isn't in React's CSSProperties
const noDrag = { WebkitAppRegion: 'no-drag' } as React.CSSProperties
const yesDrag = { WebkitAppRegion: 'drag' } as React.CSSProperties

export default function TitleBar() {
  const { isMaximized, isUnlocked, theme } = useAppStore()

  const handleMinimize = () => window.stealthNode?.minimize()
  const handleMaximize = () => window.stealthNode?.maximize()
  const handleClose = () => window.stealthNode?.close()

  return (
    <div
      className="flex items-center justify-between no-select"
      style={{
        height: 'var(--titlebar-height)',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        paddingLeft: 12, paddingRight: 8,
        ...noDrag,
      }}
    >
      {/* Window controls — explicitly no-drag */}
      <div className="flex items-center gap-2" style={{ ...noDrag }}>
        <WinBtn color="#FF5F57" hc="#FF3B30" onClick={handleClose} icon="close" />
        <WinBtn color="#FEBC2E" hc="#FF9500" onClick={handleMinimize} icon="min" />
        <WinBtn color="#28C840" hc="#28CD41" onClick={handleMaximize} icon={isMaximized ? 'restore' : 'max'} />
      </div>

      {/* Center: DRAGGABLE spacer — ONLY this area allows window dragging */}
      <div
        style={{
          flex: 1, height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: 'default',
          ...yesDrag,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L4 6v5c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" fill={theme.accent} opacity="0.9"/>
          <circle cx="12" cy="10" r="2" fill={theme.bgPrimary}/>
          <rect x="11" y="12" width="2" height="3" rx="1" fill={theme.bgPrimary}/>
        </svg>
        <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, letterSpacing: '0.5px' }}>
          STEALTHNODE
        </span>
        {isUnlocked && (
          <span style={{ fontSize: 9, color: 'var(--success)', background: 'rgba(16,185,129,0.15)',
            padding: '2px 6px', borderRadius: 999, fontWeight: 600 }}>UNLOCKED</span>
        )}
      </div>

      {/* Right spacer — no-drag */}
      <div style={{ width: 70, ...noDrag }} />
    </div>
  )
}

function WinBtn({ color, hc, onClick, icon }: { color: string; hc: string; onClick: () => void; icon: string }) {
  const [h, setH] = React.useState(false)
  return (
    <motion.button onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
      style={{
        width: 14, height: 14, borderRadius: '50%', background: h ? hc : color,
        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s', boxShadow: h ? `0 0 8px ${color}40` : 'none',
      }}>
      {h && (
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="#000" strokeWidth="1.2" strokeLinecap="round">
          {icon === 'close' && <><line x1="1.5" y1="1.5" x2="6.5" y2="6.5"/><line x1="6.5" y1="1.5" x2="1.5" y2="6.5"/></>}
          {icon === 'min' && <line x1="1.5" y1="4" x2="6.5" y2="4"/>}
          {icon === 'max' && <rect x="1.5" y="1.5" width="5" height="5" rx="0.5"/>}
          {icon === 'restore' && <><rect x="1" y="2.5" width="4" height="4" rx="0.5"/><polyline points="3,2.5 3,1 7,1 7,5 5.5,5"/></>}
        </svg>
      )}
    </motion.button>
  )
}
