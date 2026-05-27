// StealthNode — Entry Create/Edit Form with File Uploads + Rich Text Notepad
import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../store/appStore'
import { useVaultStore } from '../../store/vaultStore'
import { ENTRY_CATEGORIES, CODE_LANGUAGES, TOKEN_TYPES, LEGAL_DOCUMENT_TYPES, BANK_ACCOUNT_TYPES } from '../../../shared/constants'
import PasswordGenerator from './PasswordGenerator'
import RichTextEditor from './RichTextEditor'

interface Props { entryId: string; onClose: () => void }

export default function EntryForm({ entryId, onClose }: Props) {
  const { theme, addToast } = useAppStore()
  const { collections } = useVaultStore()
  const isNew = entryId.startsWith('new-')
  const category = isNew ? entryId.replace('new-', '') : ''
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  // Password fields
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rePassword, setRePassword] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showRePw, setShowRePw] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [email, setEmail] = useState('')
  // Token fields
  const [tokenType, setTokenType] = useState(TOKEN_TYPES[0])
  const [tokenValue, setTokenValue] = useState('')
  // Code fields
  const [language, setLanguage] = useState(CODE_LANGUAGES[0])
  const [codeContent, setCodeContent] = useState('')
  const [codeDescription, setCodeDescription] = useState('')
  // Bank fields
  const [bankName, setBankName] = useState('')
  const [accountType, setAccountType] = useState(BANK_ACCOUNT_TYPES[0])
  const [accountNumber, setAccountNumber] = useState('')
  const [cvv, setCvv] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [atmPin, setAtmPin] = useState('')
  const [mpin, setMpin] = useState('')
  // Legal fields
  const [docType, setDocType] = useState(LEGAL_DOCUMENT_TYPES[0])
  const [docNumber, setDocNumber] = useState('')
  // Link fields
  const [linkUrl, setLinkUrl] = useState('')
  // Backup codes
  const [backupCodes, setBackupCodes] = useState('')
  // Files
  const [files, setFiles] = useState<any[]>([])
  const [filePreviewUrls, setFilePreviewUrls] = useState<Record<string, string>>({})
  const [showNewCol, setShowNewCol] = useState(false)
  const [newColName, setNewColName] = useState('')
  const [newColIcon, setNewColIcon] = useState('📁')
  const cat = isNew ? category : ''
  const catInfo = ENTRY_CATEGORIES.find(c => c.id === cat) || ENTRY_CATEGORIES[0]

  useEffect(() => {
    if (!isNew) {
      window.stealthNode.getEntry(entryId).then((e: any) => {
        if (!e) return
        setTitle(e.title || ''); setNotes(e.notes || ''); setIsFavorite(!!e.isFavorite)
        setFolderId(e.folderId || 'uncategorized')
        setUsername(e.username || ''); setEmail(e.email || ''); setPassword(e.password || ''); setRePassword(e.password || ''); setWebsiteUrl(e.websiteUrl || '')
        setTokenType(e.tokenType || TOKEN_TYPES[0]); setTokenValue(e.tokenValue || '')
        setLanguage(e.language || CODE_LANGUAGES[0]); setCodeContent(e.codeContent || '')
        setBankName(e.bankName || ''); setAccountType(e.accountType || BANK_ACCOUNT_TYPES[0]); setAccountNumber(e.accountNumber || '')
        setCvv(e.cvv || ''); setExpiryDate(e.expiryDate || ''); setAtmPin(e.atmPin || ''); setMpin(e.mpin || '')
        setDocType(e.docType || LEGAL_DOCUMENT_TYPES[0]); setDocNumber(e.docNumber || '')
        setLinkUrl(e.linkUrl || ''); setBackupCodes(e.backupCodes || ''); setCodeDescription(e.codeDescription || '')
        if (e.files && Array.isArray(e.files)) {
          setFiles(e.files)
          loadFilePreviews(e.files)
        }
      })
    }
  }, [])

  async function loadFilePreviews(fileList: any[]) {
    const urls: Record<string, string> = {}
    for (const f of fileList) {
      if (f.storedPath && f.mimeType?.startsWith('image/')) {
        try {
          const base64 = await window.stealthNode.readFileAsBase64(f.storedPath)
          if (base64) urls[f.id] = `data:${f.mimeType};base64,${base64}`
        } catch {}
      }
    }
    setFilePreviewUrls(prev => ({ ...prev, ...urls }))
  }

  const [folderId, setFolderId] = useState('uncategorized')

  // File upload via dialog
  async function handleFileUpload() {
    const isImage = cat === 'image'
    const filters = isImage
      ? [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'] }]
      : [{ name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv', 'json', 'xml', 'zip', 'rar'] },
         { name: 'All Files', extensions: ['*'] }]
    
    try {
      const paths = await window.stealthNode.selectFiles(filters)
      if (paths && paths.length > 0) {
        const storedFiles = await window.stealthNode.storeMultipleFiles(paths)
        const newFiles = [...files, ...storedFiles]
        setFiles(newFiles)
        loadFilePreviews(storedFiles)
        addToast({ type: 'success', title: `${storedFiles.length} file(s) added` })
      }
    } catch (e: any) { addToast({ type: 'error', title: 'Upload failed', message: e.message }) }
  }

  // Drag and drop handler
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length === 0) return
    
    const paths = droppedFiles.map(f => (f as any).path).filter(Boolean)
    if (paths.length === 0) {
      addToast({ type: 'warning', title: 'Drop not supported', message: 'Please use the browse button instead' })
      return
    }
    
    try {
      const storedFiles = await window.stealthNode.storeMultipleFiles(paths)
      const newFiles = [...files, ...storedFiles]
      setFiles(newFiles)
      loadFilePreviews(storedFiles)
      addToast({ type: 'success', title: `${storedFiles.length} file(s) added` })
    } catch (e: any) { addToast({ type: 'error', title: 'Upload failed', message: e.message }) }
  }, [files])

  const [dragOver, setDragOver] = useState(false)

  function removeFile(fileId: string) {
    const file = files.find(f => f.id === fileId)
    if (file?.storedPath) {
      window.stealthNode.deleteFile(file.storedPath)
    }
    setFiles(files.filter(f => f.id !== fileId))
    const newPreviews = { ...filePreviewUrls }
    delete newPreviews[fileId]
    setFilePreviewUrls(newPreviews)
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  async function handleSave() {
    if (!title.trim()) { addToast({ type: 'warning', title: 'Title required' }); return }
    if (cat === 'password' && password !== rePassword) { addToast({ type: 'warning', title: 'Passwords do not match' }); return }
    setLoading(true)
    const data: any = { category: cat, title: title.trim(), notes, isFavorite, folderId,
      username, email, password, websiteUrl, tokenType, tokenValue, language, codeContent, codeDescription,
      bankName, accountType, accountNumber, cvv, expiryDate, atmPin, mpin, docType, docNumber, linkUrl, backupCodes, files }
    try {
      if (isNew) { await window.stealthNode.createEntry(data) }
      else { await window.stealthNode.updateEntry(entryId, data) }
      addToast({ type: 'success', title: isNew ? 'Entry created!' : 'Entry updated!' })
      onClose()
    } catch (e: any) { addToast({ type: 'error', title: 'Error', message: e.message }) }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13,
    background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }

  const showFileUpload = cat === 'document' || cat === 'image' || cat === 'legal'

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 300, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 18, width: 520, maxHeight: '85vh', overflow: 'auto' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 24 }}>{catInfo.icon}</span>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{isNew ? 'New' : 'Edit'} {catInfo.label}</h3>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{catInfo.subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Form */}
        <div className="p-5 flex flex-col gap-4">
          <div>
            <label style={labelStyle}>Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder={`Enter ${catInfo.label.toLowerCase()} title`} autoFocus style={inputStyle} />
          </div>

          {/* PASSWORD FIELDS */}
          {cat === 'password' && (<>
            <div><label style={labelStyle}>Website URL</label><input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://example.com" style={inputStyle} /></div>
            <div><label style={labelStyle}>Username</label><input value={username} onChange={e => setUsername(e.target.value)} placeholder="username" style={inputStyle} /></div>
            <div><label style={labelStyle}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com" style={inputStyle} /></div>
            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ ...inputStyle, paddingRight: 80 }} />
                <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 4 }}>
                  <button onClick={() => setShowPw(!showPw)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>{showPw ? '🙈' : '👁️'}</button>
                  <button onClick={() => setShowGenerator(!showGenerator)} title="Generate" style={{ background: theme.accent, border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 10, color: '#fff', fontWeight: 600 }}>GEN</button>
                </div>
              </div>
              <AnimatePresence>
                {showGenerator && <PasswordGenerator onUsePassword={(pw) => { setPassword(pw); setRePassword(pw); setShowPw(true) }} onClose={() => setShowGenerator(false)} />}
              </AnimatePresence>
            </div>
            <div>
              <label style={labelStyle}>Re-enter Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showRePw ? 'text' : 'password'} value={rePassword} onChange={e => setRePassword(e.target.value)} placeholder="••••••••" style={{ ...inputStyle, paddingRight: 40, borderColor: (password && rePassword && password !== rePassword) ? 'var(--danger)' : 'var(--border)' }} />
                <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 4 }}>
                  <button onClick={() => setShowRePw(!showRePw)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>{showRePw ? '🙈' : '👁️'}</button>
                </div>
              </div>
            </div>
          </>)}

          {/* NOTE — Rich Text Editor */}
          {cat === 'note' && (
            <div>
              <label style={labelStyle}>Note Content</label>
              <RichTextEditor content={notes} onChange={setNotes} />
            </div>
          )}

          {/* TOKEN/API KEY */}
          {cat === 'token' && (<>
            <div><label style={labelStyle}>Type</label><select value={tokenType} onChange={e => setTokenType(e.target.value)} style={inputStyle}>{TOKEN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label style={labelStyle}>Token / Key Value</label><textarea value={tokenValue} onChange={e => setTokenValue(e.target.value)} rows={3} placeholder="Paste your token here..." style={{ ...inputStyle, fontFamily: 'monospace', resize: 'vertical' }} /></div>
          </>)}

          {/* CODE */}
          {cat === 'code' && (<>
            <div><label style={labelStyle}>Language</label><select value={language} onChange={e => setLanguage(e.target.value)} style={inputStyle}>{CODE_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
            <div><label style={labelStyle}>Code</label><textarea value={codeContent} onChange={e => setCodeContent(e.target.value)} rows={8} placeholder="Paste your code snippet..." style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }} /></div>
            <div><label style={labelStyle}>Description (optional)</label><textarea value={codeDescription} onChange={e => setCodeDescription(e.target.value)} rows={2} placeholder="Description..." style={{ ...inputStyle, resize: 'vertical' }} /></div>
          </>)}

          {/* BANK */}
          {cat === 'bank' && (<>
            <div><label style={labelStyle}>Bank Name</label><input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Bank name" style={inputStyle} /></div>
            <div><label style={labelStyle}>Account Type</label><select value={accountType} onChange={e => setAccountType(e.target.value)} style={inputStyle}>{BANK_ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label style={labelStyle}>Account Number</label><input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Account number" style={inputStyle} /></div>
            <div className="flex gap-3">
              <div style={{ flex: 1 }}><label style={labelStyle}>Expiring date</label><input value={expiryDate} onChange={e => setExpiryDate(e.target.value)} placeholder="MM/YY" style={inputStyle} /></div>
              <div style={{ flex: 1 }}><label style={labelStyle}>CVV</label><input value={cvv} onChange={e => setCvv(e.target.value)} placeholder="123" maxLength={4} style={inputStyle} /></div>
            </div>
            <div className="flex gap-3">
              <div style={{ flex: 1 }}><label style={labelStyle}>Transaction pin/ATM pin</label><input value={atmPin} onChange={e => setAtmPin(e.target.value)} placeholder="ATM Pin" style={inputStyle} /></div>
              <div style={{ flex: 1 }}><label style={labelStyle}>Mpin/internet banking Pin</label><input value={mpin} onChange={e => setMpin(e.target.value)} placeholder="MPin" style={inputStyle} /></div>
            </div>
          </>)}

          {/* FILE UPLOAD for Document / Image / Legal */}
          {showFileUpload && (
            <div>
              <label style={labelStyle}>{cat === 'image' ? 'Images' : cat === 'legal' ? 'Scanned Documents' : 'Document Files'}</label>
              {/* Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={handleFileUpload}
                className={dragOver ? 'drop-zone-active' : ''}
                style={{ width: '100%', padding: '28px 14px', borderRadius: 10, background: dragOver ? 'var(--accent-muted)' : 'var(--surface)',
                  border: `2px dashed ${dragOver ? theme.accent : 'var(--border)'}`, color: 'var(--text-muted)', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{cat === 'image' ? '🖼️' : '📁'}</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Drag & Drop files here or click to browse</div>
                <div style={{ fontSize: 11, marginTop: 4, color: 'var(--text-muted)' }}>
                  {cat === 'image' ? 'JPG, PNG, GIF, WebP, SVG' : 'PDF, DOCX, XLS, TXT, CSV, or any file'}
                </div>
              </div>

              {/* File Previews */}
              {files.length > 0 && (
                <div className="file-preview-grid" style={{ marginTop: 8 }}>
                  {files.map(f => (
                    <div key={f.id} className="file-preview-item">
                      {filePreviewUrls[f.id] ? (
                        <img src={filePreviewUrls[f.id]} alt={f.originalName} />
                      ) : (
                        <>
                          <span style={{ fontSize: 20 }}>📎</span>
                          <span style={{ fontSize: 9, color: 'var(--text-muted)', padding: '0 4px', textAlign: 'center', maxWidth: '100%', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{f.originalName}</span>
                          <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>{formatFileSize(f.size)}</span>
                        </>
                      )}
                      <button className="file-preview-remove" onClick={(e) => { e.stopPropagation(); removeFile(f.id) }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* LEGAL (extra fields) */}
          {cat === 'legal' && (<>
            <div><label style={labelStyle}>Document Type</label><select value={docType} onChange={e => setDocType(e.target.value)} style={inputStyle}>{LEGAL_DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label style={labelStyle}>Document Number</label><input value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder="Document number or ID" style={inputStyle} /></div>
          </>)}

          {/* WEBLINK */}
          {cat === 'weblink' && (<div><label style={labelStyle}>URL</label><input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." style={inputStyle} /></div>)}

          {/* BACKUP CODES */}
          {cat === 'backup-code' && (<div><label style={labelStyle}>Backup Codes (one per line)</label><textarea value={backupCodes} onChange={e => setBackupCodes(e.target.value)} rows={6} placeholder="Enter backup codes, one per line" style={{ ...inputStyle, fontFamily: 'monospace', resize: 'vertical' }} /></div>)}

          {/* Notes for non-note types */}
          {cat !== 'note' && (<div><label style={labelStyle}>Notes (optional)</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Additional notes..." style={{ ...inputStyle, resize: 'vertical' }} /></div>)}

          {/* Favorite toggle & Folder selector */}
          <div className="flex gap-3">
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Collection</label>
              <select value={folderId} onChange={e => {
                if (e.target.value === '__new__') { setShowNewCol(true) }
                else { setFolderId(e.target.value) }
              }} style={inputStyle}>
                {collections.map((c: any) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                <option value="__new__">➕ Create New Collection...</option>
              </select>
              {/* Inline new collection form */}
              <AnimatePresence>
                {showNewCol && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden', marginTop: 6, background: 'var(--bg-tertiary)', borderRadius: 10, border: '1px solid var(--border)', padding: 10 }}>
                    <div className="flex gap-2 mb-2">
                      <input value={newColName} onChange={e => setNewColName(e.target.value)} placeholder="Collection name" autoFocus style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
                      <select value={newColIcon} onChange={e => setNewColIcon(e.target.value)} style={{ ...inputStyle, width: 50, marginBottom: 0, textAlign: 'center' }}>
                        {['📁','🔑','💼','🏠','🎮','📧','🛒','🏦','🎓','💻','🔧','❤️'].map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setShowNewCol(false); setNewColName('') }} style={{ flex: 1, padding: 6, borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 11 }}>Cancel</button>
                      <button onClick={async () => {
                        if (!newColName.trim()) return
                        try {
                          const col = await window.stealthNode.createCollection({ name: newColName.trim(), icon: newColIcon, iconColor: '#7C6EFF' })
                          const refreshed = await window.stealthNode.getCollections()
                          // Find the new collection and set it
                          const newCol = refreshed.find((c: any) => c.name === newColName.trim())
                          if (newCol) setFolderId(newCol.id)
                          setShowNewCol(false); setNewColName('')
                        } catch {}
                      }} disabled={!newColName.trim()} style={{ flex: 2, padding: 6, borderRadius: 6, background: newColName.trim() ? theme.accent : 'var(--surface)', border: 'none', cursor: newColName.trim() ? 'pointer' : 'not-allowed', color: '#fff', fontSize: 11, fontWeight: 600 }}>Create</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={() => setIsFavorite(!isFavorite)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, background: isFavorite ? 'var(--accent-muted)' : 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)', fontSize: 13 }}>
                <span>{isFavorite ? '⭐' : '☆'}</span> {isFavorite ? 'Favorited' : 'Add to favorites'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13 }}>Cancel</button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={loading || !title.trim()}
            style={{ flex: 2, padding: 11, borderRadius: 10, background: title.trim() ? theme.accent : 'var(--surface)', border: 'none', cursor: title.trim() ? 'pointer' : 'not-allowed', color: '#fff', fontSize: 13, fontWeight: 600, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Saving...' : isNew ? '🔒 Save & Encrypt' : '💾 Update Entry'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
