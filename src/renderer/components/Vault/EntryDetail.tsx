// StealthNode — Entry Detail View (with Master Password gates)
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../store/appStore'
import { useVaultStore } from '../../store/vaultStore'
import { ENTRY_CATEGORIES } from '../../../shared/constants'
import MasterPasswordPrompt from '../Common/MasterPasswordPrompt'

interface Props { entryId: string; onClose: () => void; onEdit: (id: string) => void }

export default function EntryDetail({ entryId, onClose, onEdit }: Props) {
  const { theme, addToast } = useAppStore()
  const vs = useVaultStore()
  const [entry, setEntry] = useState<any>(null)
  const [showPw, setShowPw] = useState(false)
  const [showCvv, setShowCvv] = useState(false)
  const [showAtmPin, setShowAtmPin] = useState(false)
  const [showMpin, setShowMpin] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [filePreviewUrls, setFilePreviewUrls] = useState<Record<string, string>>({})
  const [pwPrompt, setPwPrompt] = useState<{ action: 'edit' | 'delete' } | null>(null)

  useEffect(() => {
    window.stealthNode.getEntry(entryId).then((e: any) => {
      setEntry(e)
      if (e?.files && Array.isArray(e.files)) loadFilePreviews(e.files)
    })
  }, [entryId])

  async function loadFilePreviews(files: any[]) {
    const urls: Record<string, string> = {}
    for (const f of files) {
      if (f.storedPath && f.mimeType?.startsWith('image/')) {
        try {
          const base64 = await window.stealthNode.readFileAsBase64(f.storedPath)
          if (base64) urls[f.id] = `data:${f.mimeType};base64,${base64}`
        } catch {}
      }
    }
    setFilePreviewUrls(urls)
  }

  if (!entry) return null
  const catInfo = ENTRY_CATEGORIES.find(c => c.id === entry.category)

  async function copyField(value: string, label: string) {
    if (!value) return
    try { await window.stealthNode.copyToClipboard(value); addToast({ type: 'success', title: `${label} copied!`, message: 'Auto-clears in 30s' }) }
    catch { navigator.clipboard.writeText(value); addToast({ type: 'success', title: `${label} copied!` }) }
  }

  async function handleDelete() {
    try {
      await window.stealthNode.deleteEntry(entryId)
      addToast({ type: 'success', title: 'Moved to trash', message: 'Will be permanently deleted after 60 days' })
      vs.refreshEntries(); vs.refreshTrash(); onClose()
    } catch (e: any) { addToast({ type: 'error', title: 'Error', message: e.message }) }
  }

  async function toggleFav() {
    try { await window.stealthNode.updateEntry(entryId, { ...entry, isFavorite: !entry.isFavorite }); setEntry({ ...entry, isFavorite: !entry.isFavorite }); vs.refreshEntries() }
    catch {}
  }

  const fieldStyle: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }
  const labelSt: React.CSSProperties = { fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }
  const valSt: React.CSSProperties = { fontSize: 13, color: 'var(--text-primary)', wordBreak: 'break-all' }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 300, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}>
        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          onClick={e => e.stopPropagation()}
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 18, width: 480, maxHeight: '85vh', overflow: 'auto' }}>

          {/* Header */}
          <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3">
              <span style={{ fontSize: 28 }}>{catInfo?.icon}</span>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{entry.title}</h3>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{catInfo?.label} · {new Date(entry.updatedAt).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={toggleFav} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>{entry.isFavorite ? '⭐' : '☆'}</button>
              <button onClick={onClose} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
          </div>

          {/* Fields */}
          <div className="p-5">
            {entry.category === 'password' && (<>
              {entry.username && (<div><div style={labelSt}>Username</div><div style={fieldStyle}><span style={valSt}>{entry.username}</span><button onClick={() => copyField(entry.username, 'Username')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>📋</button></div></div>)}
              {entry.email && (<div><div style={labelSt}>Email</div><div style={fieldStyle}><span style={valSt}>{entry.email}</span><button onClick={() => copyField(entry.email, 'Email')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>📋</button></div></div>)}
              {entry.password && (<div><div style={labelSt}>Password</div><div style={fieldStyle}><span style={{ ...valSt, fontFamily: 'monospace' }}>{showPw ? entry.password : '••••••••••••'}</span><div className="flex gap-2"><button onClick={() => setShowPw(!showPw)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>{showPw ? '🙈' : '👁️'}</button><button onClick={() => copyField(entry.password, 'Password')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>📋</button></div></div></div>)}
              {entry.websiteUrl && (<div><div style={labelSt}>Website</div><div style={fieldStyle}><span style={{ ...valSt, color: theme.accent }}>{entry.websiteUrl}</span><button onClick={() => copyField(entry.websiteUrl, 'URL')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>📋</button></div></div>)}
            </>)}

            {entry.category === 'token' && (<>
              {entry.tokenType && <div><div style={labelSt}>Type</div><div style={fieldStyle}><span style={valSt}>{entry.tokenType}</span></div></div>}
              {entry.tokenValue && (<div><div style={labelSt}>Token</div><div style={fieldStyle}><span style={{ ...valSt, fontFamily: 'monospace', fontSize: 11 }}>{showPw ? entry.tokenValue : '••••••••••••••••'}</span><div className="flex gap-2"><button onClick={() => setShowPw(!showPw)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>{showPw ? '🙈' : '👁️'}</button><button onClick={() => copyField(entry.tokenValue, 'Token')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>📋</button></div></div></div>)}
            </>)}

            {entry.category === 'code' && (<>
              {entry.language && <div><div style={labelSt}>Language</div><div style={fieldStyle}><span style={valSt}>{entry.language}</span></div></div>}
              {entry.codeDescription && <div><div style={labelSt}>Description</div><div style={fieldStyle}><span style={valSt}>{entry.codeDescription}</span></div></div>}
              {entry.codeContent && <div><div style={labelSt}>Code</div><pre style={{ ...fieldStyle, fontFamily: 'monospace', fontSize: 11, whiteSpace: 'pre-wrap', display: 'block' }}>{entry.codeContent}</pre></div>}
            </>)}

            {entry.category === 'bank' && (<>
              {entry.bankName && <div><div style={labelSt}>Bank</div><div style={fieldStyle}><span style={valSt}>{entry.bankName}</span></div></div>}
              {entry.accountType && <div><div style={labelSt}>Type</div><div style={fieldStyle}><span style={valSt}>{entry.accountType}</span></div></div>}
              {entry.accountNumber && <div><div style={labelSt}>Account #</div><div style={fieldStyle}><span style={{ ...valSt, fontFamily: 'monospace' }}>{showPw ? entry.accountNumber : '••••••••'}</span><div className="flex gap-2"><button onClick={() => setShowPw(!showPw)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>{showPw ? '🙈' : '👁️'}</button><button onClick={() => copyField(entry.accountNumber, 'Account')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>📋</button></div></div></div>}
              {entry.expiryDate && <div><div style={labelSt}>Expiring Date</div><div style={fieldStyle}><span style={valSt}>{entry.expiryDate}</span><button onClick={() => copyField(entry.expiryDate, 'Expiring Date')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>📋</button></div></div>}
              {entry.cvv && <div><div style={labelSt}>CVV</div><div style={fieldStyle}><span style={{ ...valSt, fontFamily: 'monospace' }}>{showCvv ? entry.cvv : '•••'}</span><div className="flex gap-2"><button onClick={() => setShowCvv(!showCvv)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>{showCvv ? '🙈' : '👁️'}</button><button onClick={() => copyField(entry.cvv, 'CVV')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>📋</button></div></div></div>}
              {entry.atmPin && <div><div style={labelSt}>Transaction pin/ATM pin</div><div style={fieldStyle}><span style={{ ...valSt, fontFamily: 'monospace' }}>{showAtmPin ? entry.atmPin : '••••'}</span><div className="flex gap-2"><button onClick={() => setShowAtmPin(!showAtmPin)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>{showAtmPin ? '🙈' : '👁️'}</button><button onClick={() => copyField(entry.atmPin, 'ATM Pin')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>📋</button></div></div></div>}
              {entry.mpin && <div><div style={labelSt}>Mpin/internet banking Pin</div><div style={fieldStyle}><span style={{ ...valSt, fontFamily: 'monospace' }}>{showMpin ? entry.mpin : '••••'}</span><div className="flex gap-2"><button onClick={() => setShowMpin(!showMpin)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>{showMpin ? '🙈' : '👁️'}</button><button onClick={() => copyField(entry.mpin, 'MPin')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>📋</button></div></div></div>}
            </>)}

            {entry.category === 'legal' && (<>
              {entry.docType && <div><div style={labelSt}>Type</div><div style={fieldStyle}><span style={valSt}>{entry.docType}</span></div></div>}
              {entry.docNumber && <div><div style={labelSt}>Document #</div><div style={fieldStyle}><span style={{ ...valSt, fontFamily: 'monospace' }}>{showPw ? entry.docNumber : '••••••••'}</span><div className="flex gap-2"><button onClick={() => setShowPw(!showPw)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>{showPw ? '🙈' : '👁️'}</button><button onClick={() => copyField(entry.docNumber, 'Document #')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>📋</button></div></div></div>}
            </>)}

            {entry.category === 'weblink' && entry.linkUrl && <div><div style={labelSt}>URL</div><div style={fieldStyle}><span style={{ ...valSt, color: theme.accent }}>{entry.linkUrl}</span><button onClick={() => copyField(entry.linkUrl, 'URL')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>📋</button></div></div>}
            {entry.category === 'backup-code' && entry.backupCodes && <div><div style={labelSt}>Backup Codes</div><pre style={{ ...fieldStyle, fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap', display: 'block' }}>{entry.backupCodes}</pre></div>}

            {/* File Previews */}
            {entry.files && entry.files.length > 0 && (
              <div>
                <div style={labelSt}>Attached Files ({entry.files.length})</div>
                <div className="file-preview-grid">
                  {entry.files.map((f: any) => (
                    <div key={f.id} className="file-preview-item" style={{ cursor: 'pointer' }} onClick={() => window.stealthNode.openFile(f.storedPath)}>
                      {filePreviewUrls[f.id] ? <img src={filePreviewUrls[f.id]} alt={f.originalName} /> : (<><span style={{ fontSize: 24 }}>📎</span><span style={{ fontSize: 9, color: 'var(--text-muted)', padding: '0 4px', textAlign: 'center' }}>{f.originalName}</span></>)}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>Click a file to open it</div>
              </div>
            )}

            {/* Notes */}
            {entry.notes && entry.category !== 'note' && <div><div style={labelSt}>Notes</div><div style={{ ...fieldStyle, display: 'block' }}><span style={{ ...valSt, whiteSpace: 'pre-wrap' }}>{entry.notes}</span></div></div>}
            {entry.category === 'note' && entry.notes && (
              <div><div style={labelSt}>Note Content</div>
                <div style={{ ...fieldStyle, display: 'block' }}>
                  {entry.notes.startsWith('<') ? <div style={valSt} dangerouslySetInnerHTML={{ __html: entry.notes }} /> : <span style={{ ...valSt, whiteSpace: 'pre-wrap' }}>{entry.notes}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Actions — require master password */}
          <div className="flex gap-2 p-5" style={{ borderTop: '1px solid var(--border)' }}>
            <motion.button whileHover={{ scale: 1.02 }} onClick={() => setPwPrompt({ action: 'edit' })}
              style={{ flex: 2, padding: 10, borderRadius: 10, background: theme.accent, border: 'none', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600 }}>✏️ Edit</motion.button>
            {!confirmDelete ? (
              <button onClick={() => setPwPrompt({ action: 'delete' })} style={{ flex: 1, padding: 10, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--danger)', cursor: 'pointer', color: 'var(--danger)', fontSize: 13 }}>🗑️ Trash</button>
            ) : null}
          </div>
        </motion.div>
      </motion.div>

      {/* Master Password Gate */}
      <AnimatePresence>
        {pwPrompt && (
          <MasterPasswordPrompt
            title={pwPrompt.action === 'edit' ? 'Verify to Edit' : 'Verify to Delete'}
            description={pwPrompt.action === 'edit' ? 'Enter your master password to edit this entry.' : 'Enter your master password to move this entry to trash.'}
            warningText={pwPrompt.action === 'delete' ? 'This entry will be moved to trash and permanently deleted after 60 days.' : undefined}
            confirmLabel={pwPrompt.action === 'edit' ? 'Edit Entry' : 'Move to Trash'}
            isDangerous={pwPrompt.action === 'delete'}
            onConfirm={() => {
              if (pwPrompt.action === 'edit') { setPwPrompt(null); onEdit(entryId) }
              else { setPwPrompt(null); handleDelete() }
            }}
            onCancel={() => setPwPrompt(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
