import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../store/appStore'

interface Props {
  onUsePassword: (pw: string) => void
  onClose: () => void
}

export default function PasswordGenerator({ onUsePassword, onClose }: Props) {
  const { theme, addToast } = useAppStore()
  const [length, setLength] = useState(16)
  const [useUpper, setUseUpper] = useState(true)
  const [useLower, setUseLower] = useState(true)
  const [useNumbers, setUseNumbers] = useState(true)
  const [useSymbols, setUseSymbols] = useState(true)
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false)
  const [prefix, setPrefix] = useState('')
  const [generatedPw, setGeneratedPw] = useState('')

  function generate() {
    let chars = ''
    if (useUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (useLower) chars += 'abcdefghijklmnopqrstuvwxyz'
    if (useNumbers) chars += '0123456789'
    if (useSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'
    if (excludeAmbiguous) chars = chars.replace(/[Il1O0]/g, '')
    
    if (!chars) {
      setGeneratedPw(prefix)
      return
    }

    let pw = prefix
    const remainingLength = Math.max(0, length - prefix.length)
    for (let i = 0; i < remainingLength; i++) {
      pw += chars[Math.floor(Math.random() * chars.length)]
    }
    setGeneratedPw(pw)
  }

  useEffect(() => {
    generate()
  }, [length, useUpper, useLower, useNumbers, useSymbols, excludeAmbiguous, prefix])

  function copyToClipboard() {
    window.stealthNode.copyToClipboard(generatedPw)
    addToast({ type: 'success', title: 'Password copied!' })
  }

  const checkboxStyle = { accentColor: theme.accent, cursor: 'pointer' }
  const labelStyle = { fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }

  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
      style={{ overflow: 'hidden', background: 'var(--bg-tertiary)', borderRadius: 10, marginTop: 10, border: '1px solid var(--border)' }}>
      <div className="p-4 flex flex-col gap-4">
        <div style={{ background: 'var(--surface)', padding: '12px 16px', borderRadius: 8, fontFamily: 'monospace', fontSize: 16, color: 'var(--text-primary)', border: '1px solid var(--border)', wordBreak: 'break-all' }}>
          {generatedPw || 'Select options to generate'}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Length: {length}</span>
          </div>
          <input type="range" min="8" max="128" value={length} onChange={e => setLength(parseInt(e.target.value))} style={{ width: '100%', accentColor: theme.accent }} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label style={labelStyle}><input type="checkbox" checked={useUpper} onChange={e => setUseUpper(e.target.checked)} style={checkboxStyle} /> Uppercase (A-Z)</label>
          <label style={labelStyle}><input type="checkbox" checked={useLower} onChange={e => setUseLower(e.target.checked)} style={checkboxStyle} /> Lowercase (a-z)</label>
          <label style={labelStyle}><input type="checkbox" checked={useNumbers} onChange={e => setUseNumbers(e.target.checked)} style={checkboxStyle} /> Numbers (0-9)</label>
          <label style={labelStyle}><input type="checkbox" checked={useSymbols} onChange={e => setUseSymbols(e.target.checked)} style={checkboxStyle} /> Symbols (!@#$%)</label>
          <label style={labelStyle}><input type="checkbox" checked={excludeAmbiguous} onChange={e => setExcludeAmbiguous(e.target.checked)} style={checkboxStyle} /> Exclude Ambiguous (1lIO0)</label>
        </div>

        <div>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Custom Prefix</span>
          <input value={prefix} onChange={e => setPrefix(e.target.value)} placeholder="e.g. MySite-" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, fontSize: 12, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
        </div>

        <div className="flex gap-2 mt-2">
          <button onClick={onClose} style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12 }}>Cancel</button>
          <button onClick={copyToClipboard} style={{ flex: 1, padding: '8px 12px', borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)', fontSize: 12 }}>Copy</button>
          <button onClick={() => { onUsePassword(generatedPw); onClose() }} style={{ flex: 2, padding: '8px 12px', borderRadius: 6, background: theme.accent, border: 'none', cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 600 }}>Use This Password</button>
        </div>
      </div>
    </motion.div>
  )
}
