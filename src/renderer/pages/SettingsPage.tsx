// StealthNode — Settings Page (Security-First, All Actions Gated)
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/appStore'
import { useVaultStore } from '../store/vaultStore'
import { THEMES, FONT_OPTIONS, AUTO_LOCK_OPTIONS, CLIPBOARD_CLEAR_OPTIONS } from '../../shared/constants'
import MasterPasswordPrompt from '../components/Common/MasterPasswordPrompt'

type PendingAction = 'changePassword' | 'backup' | 'restore' | 'exportJSON' | 'exportCSV' | 'importJSON' | 'importCSV' | 'deleteVault'

export default function SettingsPage() {
  const { theme, setTheme, setView, settings, setSettings, addToast, activeProfile, lockVault } = useAppStore()
  const vs = useVaultStore()

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [showChangePw, setShowChangePw] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmNewPw, setConfirmNewPw] = useState('')
  const [changingPw, setChangingPw] = useState(false)
  const [confirmDeleteVault, setConfirmDeleteVault] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [pendingRestoreFile, setPendingRestoreFile] = useState<{filePath: string, encrypted: boolean} | null>(null)
  const [restorePassword, setRestorePassword] = useState('')

  function isDangerous(a: PendingAction) { return ['deleteVault', 'restore', 'importJSON', 'importCSV'].includes(a) }

  const actionMeta: Record<PendingAction, { title: string; desc: string; warn?: string; label: string }> = {
    changePassword: { title: 'Change Master Password', desc: 'Verify your identity to change the master password.', label: 'Proceed' },
    backup: { title: 'Create Backup', desc: 'Verify to create an encrypted vault backup.', label: 'Create Backup' },
    restore: { title: 'Restore from Backup', desc: 'This will replace your current vault data.', warn: 'All current entries will be overwritten with the backup data.', label: 'Restore' },
    exportJSON: { title: 'Export Vault (JSON)', desc: 'Verify to export your vault data.', label: 'Export' },
    exportCSV: { title: 'Export Vault (CSV)', desc: 'Verify to export your vault data as CSV.', label: 'Export CSV' },
    importJSON: { title: 'Import Data (JSON)', desc: 'Import entries from a JSON file.', warn: 'Imported entries will be merged into your vault.', label: 'Import' },
    importCSV: { title: 'Import Data (CSV)', desc: 'Import entries from a CSV file.', warn: 'Imported entries will be merged into your vault.', label: 'Import CSV' },
    deleteVault: { title: 'Delete Entire Vault', desc: 'This action is permanent and cannot be undone.', warn: 'All passwords, notes, files, and settings will be permanently destroyed.', label: 'Delete Vault' },
  }

  async function executeAction(action: PendingAction, password?: string) {
    try {
      switch (action) {
        case 'changePassword': setShowChangePw(true); break
        case 'backup': { if (!password) return; const r = await window.stealthNode.createBackup(password); if (r.success) addToast({ type: 'success', title: 'Encrypted backup created!', message: `Saved to ${r.path}` }); break }
        case 'exportJSON': { const r = await window.stealthNode.exportJSON(); if (r.success) addToast({ type: 'success', title: 'Export complete!', message: `${r.count} entries exported` }); break }
        case 'exportCSV': { const r = await window.stealthNode.exportCSV(); if (r.success) addToast({ type: 'success', title: 'CSV exported!' }); break }
        case 'importJSON': { const r = await window.stealthNode.importJSON(); if (r.success) { addToast({ type: 'success', title: `${r.count} entries imported` }); vs.refreshEntries() } break }
        case 'importCSV': { const r = await window.stealthNode.importCSV(); if (r.success) { addToast({ type: 'success', title: `${r.count} entries imported` }); vs.refreshEntries() } break }
        case 'deleteVault': setConfirmDeleteVault(true); break
      }
    } catch (e: any) { addToast({ type: 'error', title: 'Error', message: e.message }) }
  }

  async function handleChangePassword() {
    if (!currentPw || !newPw || !confirmNewPw) { addToast({ type: 'warning', title: 'All fields required' }); return }
    if (newPw !== confirmNewPw) { addToast({ type: 'warning', title: 'Passwords don\'t match' }); return }
    if (newPw.length < 8) { addToast({ type: 'warning', title: 'Min 8 characters' }); return }
    setChangingPw(true)
    try {
      const r = await window.stealthNode.changePassword(currentPw, newPw)
      if (r.success) { addToast({ type: 'success', title: 'Password changed!' }); setShowChangePw(false); setCurrentPw(''); setNewPw(''); setConfirmNewPw('') }
      else addToast({ type: 'error', title: 'Failed', message: r.error })
    } catch (e: any) { addToast({ type: 'error', title: 'Error', message: e.message }) }
    setChangingPw(false)
  }

  async function handleSelectRestore() {
    try {
      const r = await window.stealthNode.selectBackupFile()
      if (r.success) {
        setPendingRestoreFile({ filePath: r.filePath, encrypted: r.encrypted })
        setRestorePassword('')
      } else if (r.error) {
        addToast({ type: 'error', title: 'Error reading file', message: r.error })
      }
    } catch (e: any) {
      addToast({ type: 'error', title: 'Error', message: e.message })
    }
  }

  async function executeRestore() {
    if (!pendingRestoreFile) return
    const r = await window.stealthNode.restoreBackup(pendingRestoreFile.filePath, restorePassword)
    if (r.success) {
      addToast({ type: 'success', title: 'Backup restored!' })
      setPendingRestoreFile(null)
      vs.refreshEntries()
      vs.refreshCollections()
    } else {
      addToast({ type: 'error', title: 'Restore Failed', message: r.error || 'Incorrect password or corrupted file' })
    }
  }

  async function handleDeleteVault() {
    if (deleteConfirmText.toLowerCase() !== 'delete my vault') { addToast({ type: 'warning', title: 'Type "delete my vault"' }); return }
    if (!activeProfile) return
    const idToDelete = activeProfile.id
    setConfirmDeleteVault(false)
    lockVault()
    setTimeout(async () => {
      try {
        await window.stealthNode.deleteProfile(idToDelete)
        addToast({ type: 'success', title: 'Vault permanently deleted' })
      } catch (e: any) {
        addToast({ type: 'error', title: 'Error deleting vault', message: e.message })
      }
    }, 100)
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => setView('vault')} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>⚙️ Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6" style={{ maxWidth: 600, margin: '0 auto', width: '100%' }}>

        {/* APPEARANCE */}
        <Section title="🎨 Appearance">
          <Label>Theme</Label>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {THEMES.map(t => (
              <button key={t.id} onClick={() => setTheme(t.id)} style={{ padding: 10, borderRadius: 10, background: t.bgPrimary, border: theme.id === t.id ? `2px solid ${t.accent}` : '2px solid transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all 0.2s' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: t.accent, boxShadow: theme.id === t.id ? `0 0 12px ${t.accent}60` : 'none' }} />
                <span style={{ fontSize: 10, color: t.textPrimary, fontWeight: 500 }}>{t.name}</span>
              </button>
            ))}
          </div>
          <Label>Font</Label>
          <select value={settings.fontFamily} onChange={e => { setSettings({ fontFamily: e.target.value }); document.body.style.fontFamily = e.target.value }} style={selectStyle}>
            {FONT_OPTIONS.map(f => <option key={f.id} value={f.family}>{f.name}</option>)}
          </select>
        </Section>

        {/* PROFILE */}
        <Section title="👤 Profile">
          {activeProfile && (
            <div className="flex items-center gap-3 mb-3" style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, border: '1px solid var(--border)' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: `linear-gradient(135deg, ${activeProfile.avatarGradientFrom}, ${activeProfile.avatarGradientTo})` }}>
                {activeProfile.avatarType === 'emoji' ? activeProfile.avatarEmoji : <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{activeProfile.avatarInitials}</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{activeProfile.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Last active: {activeProfile.lastUnlockedAt ? new Date(activeProfile.lastUnlockedAt).toLocaleString() : 'Just now'}</div>
              </div>
            </div>
          )}
          <motion.button whileHover={{ scale: 1.01 }} onClick={lockVault} style={{ ...btnStyle, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>🔄 Switch / Lock Profile</motion.button>
        </Section>

        {/* SECURITY */}
        <Section title="🔒 Security">
          <Label>Master Password</Label>
          {!showChangePw ? (
            <button onClick={() => setPendingAction('changePassword')} style={btnStyle}>🔑 Change Master Password</button>
          ) : (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={{ overflow: 'hidden', background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)', padding: 14, marginBottom: 12 }}>
              <div className="flex flex-col gap-3">
                <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Current password" style={inputStyle} />
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="New password (min 8 chars)" style={inputStyle} />
                <input type="password" value={confirmNewPw} onChange={e => setConfirmNewPw(e.target.value)} placeholder="Confirm new password" style={{ ...inputStyle, borderColor: confirmNewPw && newPw !== confirmNewPw ? 'var(--danger)' : 'var(--border)' }} />
                <div className="flex gap-2">
                  <button onClick={() => { setShowChangePw(false); setCurrentPw(''); setNewPw(''); setConfirmNewPw('') }} style={{ ...btnStyle, flex: 1 }}>Cancel</button>
                  <button onClick={handleChangePassword} disabled={changingPw} style={{ flex: 2, padding: '10px 14px', borderRadius: 10, background: theme.accent, border: 'none', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600, opacity: changingPw ? 0.6 : 1 }}>{changingPw ? 'Changing...' : '🔒 Change Password'}</button>
                </div>
              </div>
            </motion.div>
          )}
          <Label>Auto-lock timeout</Label>
          <select value={settings.autoLockTimeout} onChange={e => setSettings({ autoLockTimeout: Number(e.target.value) })} style={selectStyle}>{AUTO_LOCK_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          <div className="flex items-center gap-2 mt-2 mb-4">
            <input type="checkbox" checked={settings.minimizeToTray} onChange={e => setSettings({ minimizeToTray: e.target.checked })} style={{ accentColor: theme.accent }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Minimize to system tray on close</span>
          </div>
          <Label>Clipboard auto-clear</Label>
          <select value={settings.clipboardClearDuration} onChange={e => setSettings({ clipboardClearDuration: Number(e.target.value) })} style={selectStyle}>{CLIPBOARD_CLEAR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        </Section>

        {/* BACKUP & RESTORE — all gated */}
        <Section title="💾 Backup & Restore">
          <div className="grid grid-cols-2 gap-2">
            <motion.button whileHover={{ scale: 1.01 }} onClick={() => setPendingAction('backup')} style={btnStyle}>📦 Backup Now</motion.button>
            <motion.button whileHover={{ scale: 1.01 }} onClick={handleSelectRestore} style={{ ...btnStyle, borderColor: 'var(--warning)' }}>🔄 Restore Backup</motion.button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Backups are encrypted and password-protected.</p>
        </Section>

        {/* IMPORT & EXPORT — all gated */}
        <Section title="📥 Import & Export">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <motion.button whileHover={{ scale: 1.01 }} onClick={() => setPendingAction('importJSON')} style={btnStyle}>⬇️ Import JSON</motion.button>
            <motion.button whileHover={{ scale: 1.01 }} onClick={() => setPendingAction('importCSV')} style={btnStyle}>⬇️ Import CSV</motion.button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <motion.button whileHover={{ scale: 1.01 }} onClick={() => setPendingAction('exportJSON')} style={btnStyle}>⬆️ Export JSON</motion.button>
            <motion.button whileHover={{ scale: 1.01 }} onClick={() => setPendingAction('exportCSV')} style={btnStyle}>⬆️ Export CSV</motion.button>
          </div>
        </Section>

        {/* DANGER ZONE — gated */}
        <Section title="⚠️ Danger Zone">
          <div style={{ background: 'rgba(255, 69, 58, 0.08)', border: '1px solid rgba(255, 69, 58, 0.25)', borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 12 }}>These actions are irreversible.</p>
            {!confirmDeleteVault ? (
              <button onClick={() => setPendingAction('deleteVault')} style={{ ...btnStyle, background: 'var(--danger)', color: '#fff', border: 'none', width: '100%' }}>🗑️ Delete Entire Vault</button>
            ) : (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="flex flex-col gap-3">
                <p style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>Type "delete my vault" to confirm:</p>
                <input value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder='Type "delete my vault"' style={{ ...inputStyle, borderColor: 'var(--danger)' }} />
                <div className="flex gap-2">
                  <button onClick={() => { setConfirmDeleteVault(false); setDeleteConfirmText('') }} style={{ ...btnStyle, flex: 1 }}>Cancel</button>
                  <button onClick={handleDeleteVault} disabled={deleteConfirmText.toLowerCase() !== 'delete my vault'} style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: deleteConfirmText.toLowerCase() === 'delete my vault' ? 'var(--danger)' : 'var(--surface)', border: 'none', cursor: deleteConfirmText.toLowerCase() === 'delete my vault' ? 'pointer' : 'not-allowed', color: '#fff', fontSize: 13, fontWeight: 600, opacity: deleteConfirmText.toLowerCase() === 'delete my vault' ? 1 : 0.5 }}>Permanently Delete</button>
                </div>
              </motion.div>
            )}
          </div>
        </Section>

        {/* ABOUT */}
        <Section title="ℹ️ About">
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3 mb-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v5c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" fill={theme.accent}/><circle cx="12" cy="10" r="2" fill={theme.bgPrimary}/><rect x="11" y="12" width="2" height="3" rx="1" fill={theme.bgPrimary}/></svg>
              <div><div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>StealthNode</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>v1.1.0 · Made by xylas007</div></div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>Enterprise-grade encrypted password manager. AES-256-GCM encryption, local-only storage.</p>
          </div>
        </Section>
      </div>

      {/* MASTER PASSWORD GATE */}
      <AnimatePresence>
        {pendingAction && (
          <MasterPasswordPrompt
            title={actionMeta[pendingAction].title}
            description={actionMeta[pendingAction].desc}
            warningText={actionMeta[pendingAction].warn}
            confirmLabel={actionMeta[pendingAction].label}
            isDangerous={isDangerous(pendingAction)}
            onConfirm={(password) => { const a = pendingAction; setPendingAction(null); executeAction(a, password) }}
            onCancel={() => setPendingAction(null)}
          />
        )}
      </AnimatePresence>

      {/* RESTORE BACKUP PROMPT */}
      <AnimatePresence>
        {pendingRestoreFile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="w-full max-w-sm rounded-2xl p-6 shadow-2xl relative" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Restore Backup</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>You are about to restore a backup file. <span style={{ color: 'var(--warning)', fontWeight: 600 }}>This will OVERWRITE your current vault entirely.</span> All current entries not in the backup will be permanently lost.</p>
              
              {pendingRestoreFile.encrypted && (
                <div className="mb-4">
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Enter the password used to encrypt this backup:</p>
                  <input type="password" value={restorePassword} onChange={e => setRestorePassword(e.target.value)} placeholder="Backup Password" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} autoFocus />
                </div>
              )}
              
              <div className="flex gap-2 mt-4">
                <button onClick={() => setPendingRestoreFile(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={executeRestore} style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'var(--warning)', border: 'none', color: '#000', fontWeight: 600, cursor: 'pointer' }}>Overwrite Vault</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 24 }}><h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>{title}</h3>{children}</div>
}
function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, marginTop: 8 }}>{children}</div>
}

const selectStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', marginBottom: 8 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }
const btnStyle: React.CSSProperties = { padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer', width: '100%' }
