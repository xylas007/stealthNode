// StealthNode — Main Vault Layout
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/appStore'
import { useVaultStore } from '../store/vaultStore'
import { NAV_ITEMS, ENTRY_CATEGORIES, COLLECTION_ICONS, COLLECTION_COLORS } from '../../shared/constants'
import EntryForm from '../components/Vault/EntryForm'
import EntryDetail from '../components/Vault/EntryDetail'
import MasterPasswordPrompt from '../components/Common/MasterPasswordPrompt'

export default function VaultMain() {
  const { theme, sidebarCollapsed, setSidebarCollapsed, lockVault, setView, addToast } = useAppStore()
  const vs = useVaultStore()
  const [searchFocused, setSearchFocused] = useState(false)
  const [showNewCollection, setShowNewCollection] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [galleryPwPrompt, setGalleryPwPrompt] = useState(false)
  const [galleryImages, setGalleryImages] = useState<{id: string, title: string, src: string}[]>([])
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [newColName, setNewColName] = useState('')
  const [newColIcon, setNewColIcon] = useState('📁')
  const [newColColor, setNewColColor] = useState('#7C6EFF')

  useEffect(() => { vs.refreshEntries(); vs.refreshCollections(); vs.refreshTrash() }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') { e.preventDefault(); document.getElementById('vault-search')?.focus() }
      if (e.ctrlKey && e.key === 'n') { e.preventDefault(); vs.setShowCategorySelect(true) }
      if (e.ctrlKey && e.key === 'b') { e.preventDefault(); setSidebarCollapsed(!sidebarCollapsed) }
      if (e.key === 'Escape') { vs.setSearchQuery(''); vs.setSelectedEntryId(null); vs.setShowCategorySelect(false); vs.setEditingEntryId(null) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [sidebarCollapsed])

  const isTrashView = vs.activeFilter === 'trash'

  const filtered = isTrashView ? vs.trashEntries : vs.entries.filter((e: any) => {
    if (vs.searchQuery) { const q = vs.searchQuery.toLowerCase(); return e.title?.toLowerCase().includes(q) || e.notes?.toLowerCase().includes(q) }
    if (vs.activeFilter === 'favorites' && !e.isFavorite) return false
    if (vs.activeFolderId && e.folderId !== vs.activeFolderId) return false
    if (vs.activeCategory && e.category !== vs.activeCategory && !vs.activeFolderId) return false
    return true
  })

  const sW = sidebarCollapsed ? 60 : 260

  async function createCollection() {
    if (!newColName.trim()) return
    try {
      await window.stealthNode.createCollection({ name: newColName.trim(), icon: newColIcon, iconColor: newColColor })
      vs.refreshCollections()
      addToast({ type: 'success', title: 'Collection created' })
      setShowNewCollection(false); setNewColName('')
    } catch (e: any) { addToast({ type: 'error', title: 'Error', message: e.message }) }
  }

  async function loadGalleryImages() {
    setGalleryLoading(true)
    try {
      const allEntries = await window.stealthNode.getEntries('image')
      const imgs: {id: string, title: string, src: string}[] = []
      for (const entry of allEntries) {
        if (entry.files && Array.isArray(entry.files)) {
          for (const f of entry.files) {
            if (f.storedPath && f.mimeType?.startsWith('image/')) {
              try {
                const b64 = await window.stealthNode.readFileAsBase64(f.storedPath)
                if (b64) imgs.push({ id: f.id, title: entry.title || f.originalName, src: `data:${f.mimeType};base64,${b64}` })
                // Yield to main thread to prevent UI freezing on massive vaults
                await new Promise(r => setTimeout(r, 10))
              } catch {}
            }
          }
        }
      }
      setGalleryImages(imgs)
    } catch { setGalleryImages([]) }
    setGalleryLoading(false)
  }
  function selectCategory(catId: string) {
    vs.setShowCategorySelect(false)
    vs.setEditingEntryId('new-' + catId)
  }

  function copyPrimaryValue(e: React.MouseEvent, entry: any) {
    e.stopPropagation()
    let val = ''
    if (entry.category === 'password') val = entry.password
    else if (entry.category === 'token') val = entry.tokenValue
    else if (entry.category === 'bank') val = entry.accountNumber || entry.cardNumber
    else if (entry.category === 'weblink') val = entry.linkUrl
    else val = entry.notes || entry.title
    
    if (val) {
      window.stealthNode.copyToClipboard(val)
      addToast({ type: 'success', title: 'Copied to clipboard' })
    } else {
      addToast({ type: 'warning', title: 'Nothing to copy' })
    }
  }

  async function handleRestoreEntry(e: React.MouseEvent, entryId: string) {
    e.stopPropagation()
    try {
      await window.stealthNode.restoreEntry(entryId)
      vs.refreshEntries(); vs.refreshTrash()
      addToast({ type: 'success', title: 'Entry restored!' })
    } catch { addToast({ type: 'error', title: 'Failed to restore' }) }
  }

  async function handleHardDelete(e: React.MouseEvent, entryId: string) {
    e.stopPropagation()
    try {
      await window.stealthNode.hardDeleteEntry(entryId)
      vs.refreshTrash()
      addToast({ type: 'success', title: 'Permanently deleted' })
    } catch { addToast({ type: 'error', title: 'Failed to delete' }) }
  }

  function daysUntilPurge(deletedAt: string): number {
    const deleted = new Date(deletedAt).getTime()
    const remaining = 60 - Math.floor((Date.now() - deleted) / (24 * 60 * 60 * 1000))
    return Math.max(0, remaining)
  }

  return (
    <div className="flex w-full h-full" style={{ background: 'var(--bg-primary)' }}>
      {/* SIDEBAR */}
      <motion.aside animate={{ width: sW }} transition={{ duration: 0.2 }}
        style={{ height: '100%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)',
          background: 'var(--bg-secondary)', overflow: 'hidden', flexShrink: 0,
          position: 'relative', zIndex: 10,
          ...({ WebkitAppRegion: 'no-drag' } as React.CSSProperties) }}>

        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 6v5c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" fill={theme.accent}/>
            <circle cx="12" cy="10" r="2" fill={theme.bgSecondary}/><rect x="11" y="12" width="2" height="3" rx="1" fill={theme.bgSecondary}/>
          </svg>
          {!sidebarCollapsed && <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: 1, color: 'var(--text-primary)' }}>STEALTHNODE</span>}
        </div>

        {!sidebarCollapsed && (
          <div className="px-3 py-2">
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-muted)' }}>🔍</span>
              <input id="vault-search" value={vs.searchQuery} onChange={e => vs.setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} placeholder="Search..."
                style={{ width: '100%', padding: '8px 12px 8px 30px', borderRadius: 999, fontSize: 12,
                  background: 'var(--bg-tertiary)', border: `1px solid ${searchFocused ? theme.accent : 'var(--border)'}`,
                  color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }} />
            </div>
          </div>
        )}

        {!sidebarCollapsed && (
          <div className="flex gap-1 px-3 pb-2">
            {(['all', 'favorites', 'recent'] as const).map(f => (
              <div key={f} role="button" tabIndex={0}
                onClick={() => { setShowGallery(false); vs.setActiveFilter(f); vs.setActiveCategory(null) }}
                style={{ padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500,
                  background: vs.activeFilter === f ? 'var(--accent-muted)' : 'transparent',
                  color: vs.activeFilter === f ? theme.accent : 'var(--text-muted)',
                  cursor: 'pointer', textTransform: 'capitalize', userSelect: 'none', pointerEvents: 'auto' } as React.CSSProperties}>
                {f === 'favorites' ? '⭐ ' : ''}{f}
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-2 py-1" style={{ fontSize: 13 }}>
          {NAV_ITEMS.map(item => {
            const isActive = vs.activeCategory === item.category && !vs.activeFolderId && !isTrashView
            const count = item.category ? vs.entries.filter((e: any) => e.category === item.category).length : vs.entries.length
            return (
              <div key={item.id} role="button" tabIndex={0}
                onClick={() => { setShowGallery(false); vs.setActiveCategory(item.category); vs.setActiveFilter('all') }}
                className="flex items-center gap-2 w-full"
                style={{ padding: sidebarCollapsed ? '8px' : '8px 10px', borderRadius: 8,
                  background: isActive ? 'var(--surface-hover)' : 'transparent',
                  borderLeft: isActive ? `3px solid ${theme.accent}` : '3px solid transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer', transition: 'all 0.15s', pointerEvents: 'auto',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start', marginBottom: 1,
                  userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}>
                <span style={{ fontSize: 15, pointerEvents: 'none' }}>{item.icon}</span>
                {!sidebarCollapsed && <span className="flex-1 text-left" style={{ fontSize: 12, pointerEvents: 'none' }}>{item.label}</span>}
                {!sidebarCollapsed && count > 0 && <span style={{ fontSize: 10, color: 'var(--text-muted)',
                  background: 'var(--bg-tertiary)', padding: '1px 5px', borderRadius: 999, pointerEvents: 'none' }}>{count}</span>}
              </div>
            )
          })}

          {/* TRASH BIN */}
          {!sidebarCollapsed && (
            <div role="button" tabIndex={0}
              onClick={() => { setShowGallery(false); vs.setActiveFilter('trash'); vs.setActiveCategory(null) }}
              className="flex items-center gap-2 w-full"
              style={{ padding: '8px 10px', borderRadius: 8, marginTop: 4,
                background: isTrashView ? 'var(--surface-hover)' : 'transparent',
                borderLeft: isTrashView ? `3px solid var(--danger)` : '3px solid transparent',
                color: isTrashView ? 'var(--danger)' : 'var(--text-secondary)',
                cursor: 'pointer', transition: 'all 0.15s', pointerEvents: 'auto', userSelect: 'none' } as React.CSSProperties}>
              <span style={{ fontSize: 15, pointerEvents: 'none' }}>🗑️</span>
              <span className="flex-1 text-left" style={{ fontSize: 12, pointerEvents: 'none' }}>Trash</span>
              {vs.trashEntries.length > 0 && <span className="trash-badge" style={{ pointerEvents: 'none' }}>{vs.trashEntries.length}</span>}
            </div>
          )}

          {/* GALLERY */}
          {!sidebarCollapsed && (
            <div role="button" tabIndex={0}
              onClick={() => setGalleryPwPrompt(true)}
              className="flex items-center gap-2 w-full"
              style={{ padding: '8px 10px', borderRadius: 8, marginTop: 4,
                background: showGallery ? 'var(--surface-hover)' : 'transparent',
                borderLeft: showGallery ? `3px solid ${theme.accent}` : '3px solid transparent',
                color: showGallery ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer', transition: 'all 0.15s', pointerEvents: 'auto', userSelect: 'none' } as React.CSSProperties}>
              <span style={{ fontSize: 15, pointerEvents: 'none' }}>🖼️</span>
              <span className="flex-1 text-left" style={{ fontSize: 12, pointerEvents: 'none' }}>Gallery</span>
            </div>
          )}

          {!sidebarCollapsed && (
            <div className="mt-3">
              <div className="flex items-center justify-between px-2 mb-1">
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Collections</span>
                <div role="button" tabIndex={0} onClick={() => setShowNewCollection(true)}
                  style={{ background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 15, lineHeight: 1, pointerEvents: 'auto', userSelect: 'none' } as React.CSSProperties}>+</div>
              </div>
              {vs.collections.map((col: any) => (
                <div key={col.id} role="button" tabIndex={0}
                  onClick={() => { setShowGallery(false); vs.setActiveFolderId(col.id); vs.setActiveFilter('all') }}
                  className="flex items-center gap-2 w-full"
                  style={{ padding: '5px 10px', borderRadius: 6, background: vs.activeFolderId === col.id ? 'var(--surface-hover)' : 'transparent',
                    color: vs.activeFolderId === col.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: 12, transition: 'all 0.15s', pointerEvents: 'auto', userSelect: 'none' } as React.CSSProperties}>
                  <span style={{ color: col.iconColor || '#7C6EFF', pointerEvents: 'none' }}>{col.icon || '📁'}</span>
                  <span className="flex-1 text-left truncate" style={{ pointerEvents: 'none' }}>{col.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 p-2" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex gap-2">
            <div role="button" tabIndex={0} onClick={() => setView('settings')} title="Settings"
              style={{ flex: 1, padding: 7, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)',
                cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--text-secondary)', pointerEvents: 'auto', userSelect: 'none' } as React.CSSProperties}>
              ⚙️{!sidebarCollapsed && <span style={{ fontSize: 11, pointerEvents: 'none' }}>Settings</span>}
            </div>
            <div role="button" tabIndex={0} onClick={() => lockVault()} title="Lock"
              style={{ flex: 1, padding: 7, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)',
                cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--text-secondary)', pointerEvents: 'auto', userSelect: 'none' } as React.CSSProperties}>
              🔒{!sidebarCollapsed && <span style={{ fontSize: 11, pointerEvents: 'none' }}>Lock</span>}
            </div>
          </div>
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between px-2 pt-1">
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Made by XYLAS</span>
              <div className="flex gap-2">
                <a href="https://github.com/xylas007" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', fontSize: 12, textDecoration: 'none', pointerEvents: 'auto' }}>GitHub</a>
                <a href="https://www.patreon.com/cw/xylascode" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', fontSize: 12, textDecoration: 'none', pointerEvents: 'auto' }}>Patreon</a>
              </div>
            </div>
          )}
        </div>
      </motion.aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)' }}>
              {sidebarCollapsed ? '☰' : '◀'}
            </button>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: isTrashView ? 'var(--danger)' : 'var(--text-primary)' }}>
              {showGallery ? '🖼️ Image Gallery' :
               isTrashView ? '🗑️ Trash Bin' :
                vs.activeCategory ? NAV_ITEMS.find(n => n.category === vs.activeCategory)?.label || 'All Items'
                : vs.activeFolderId ? vs.collections.find((c: any) => c.id === vs.activeFolderId)?.name || 'Folder' : 'All Items'}
            </h2>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '2px 7px', borderRadius: 999 }}>{showGallery ? galleryImages.length : filtered.length}</span>
            {isTrashView && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Auto-deletes after 60 days</span>}
          </div>
          <div className="flex items-center gap-2">
            {!isTrashView && <>
              <button onClick={() => vs.setViewMode(vs.viewMode === 'grid' ? 'list' : 'grid')}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 9px', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
                {vs.viewMode === 'grid' ? '☰' : '▦'}
              </button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => vs.setShowCategorySelect(true)}
                style={{ background: theme.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                + Add New
              </motion.button>
            </>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {showGallery ? (
            galleryLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 44, opacity: 0.25 }}>⏳</div>
                <p style={{ fontSize: 15, fontWeight: 500 }}>Decrypting images...</p>
              </div>
            ) : galleryImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 44, opacity: 0.25 }}>🖼️</div>
                <p style={{ fontSize: 15, fontWeight: 500 }}>Gallery is empty</p>
                <p style={{ fontSize: 12 }}>Upload images to your entries to see them here</p>
              </div>
            ) : (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                {galleryImages.map((img, i) => (
                  <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}
                    onClick={() => vs.setSelectedEntryId(img.id)}>
                    <div style={{ width: '100%', aspectRatio: '1', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      <img src={img.src} alt={img.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '8px 12px', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }} className="truncate">
                      {img.title}
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 44, opacity: 0.25 }}>{isTrashView ? '🗑️' : '🔐'}</div>
              <p style={{ fontSize: 15, fontWeight: 500 }}>{isTrashView ? 'Trash is empty' : 'No entries yet'}</p>
              <p style={{ fontSize: 12 }}>{isTrashView ? 'Deleted items will appear here for 60 days' : 'Click "Add New" to store your first secret'}</p>
            </div>
          ) : (
            <div className={vs.viewMode === 'grid' && !isTrashView ? 'grid gap-3' : 'flex flex-col gap-2'}
              style={vs.viewMode === 'grid' && !isTrashView ? { gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' } : {}}>
              {filtered.map((entry: any, i: number) => (
                <motion.div key={entry.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}
                  whileHover={{ y: -2 }} onClick={() => !isTrashView && vs.setSelectedEntryId(entry.id)}
                  className="group relative"
                  style={{ background: 'var(--surface)', border: `1px solid ${isTrashView ? 'rgba(244,63,94,0.2)' : 'var(--border)'}`, borderRadius: 14, padding: 16, cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', flexDirection: isTrashView ? 'row' : vs.viewMode === 'grid' ? 'column' : 'row', gap: isTrashView ? 14 : vs.viewMode === 'grid' ? 8 : 14, alignItems: (isTrashView || vs.viewMode === 'list') ? 'center' : 'stretch' }}>
                  
                  <div className="flex items-center gap-3" style={{ flex: 1 }}>
                    <span style={{ fontSize: 20 }}>{ENTRY_CATEGORIES.find(c => c.id === entry.category)?.icon || '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }} className="truncate">{entry.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }} className="truncate">
                        {isTrashView ? `${daysUntilPurge(entry.deletedAt)} days left` : entry.username || entry.websiteUrl || entry.category}
                      </div>
                    </div>
                    {entry.isFavorite && !isTrashView && <span style={{ fontSize: 12 }}>⭐</span>}
                  </div>

                  {isTrashView ? (
                    <div className="flex gap-2">
                      <button onClick={(e) => handleRestoreEntry(e, entry.id)}
                        style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--success)', border: 'none', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        ↩️ Restore
                      </button>
                      <button onClick={(e) => handleHardDelete(e, entry.id)}
                        style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--danger)', border: 'none', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        🗑️ Delete
                      </button>
                    </div>
                  ) : (
                    <>
                      {vs.viewMode === 'grid' && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(entry.updatedAt).toLocaleDateString()}</div>}
                      <button onClick={(e) => copyPrimaryValue(e, entry)} title="Copy"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}>
                        📋
                      </button>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CATEGORY SELECT MODAL */}
      <AnimatePresence>
        {vs.showCategorySelect && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 200, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => vs.setShowCategorySelect(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 18, padding: 24, width: 500 }}>
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Add New Entry</h3>
                <button onClick={() => vs.setShowCategorySelect(false)}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, width: 26, height: 26, cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ENTRY_CATEGORIES.map(cat => (
                  <motion.button key={cat.id} whileHover={{ y: -1, borderColor: cat.color }} onClick={() => selectCategory(cat.id)}
                    style={{ padding: 14, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s' }}>
                    <span style={{ fontSize: 24 }}>{cat.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{cat.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{cat.subtitle}</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ENTRY FORM (create/edit) */}
      <AnimatePresence>
        {vs.editingEntryId && (
          <EntryForm entryId={vs.editingEntryId} onClose={() => { vs.setEditingEntryId(null); vs.refreshEntries() }} />
        )}
      </AnimatePresence>

      {/* ENTRY DETAIL (view) */}
      <AnimatePresence>
        {vs.selectedEntryId && !vs.editingEntryId && (
          <EntryDetail entryId={vs.selectedEntryId} onClose={() => vs.setSelectedEntryId(null)} onEdit={(id) => vs.setEditingEntryId(id)} />
        )}
      </AnimatePresence>

      {/* NEW COLLECTION MODAL */}
      <AnimatePresence>
        {showNewCollection && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 200, background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowNewCollection(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, width: 380 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>New Collection</h3>
              <input value={newColName} onChange={e => setNewColName(e.target.value)} placeholder="Collection name" autoFocus
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', fontSize: 13, marginBottom: 12 }} />
              <div className="flex gap-1 flex-wrap mb-3">
                {COLLECTION_ICONS.map(ic => (
                  <button key={ic} onClick={() => setNewColIcon(ic)}
                    style={{ width: 32, height: 32, borderRadius: 6, fontSize: 16, border: newColIcon === ic ? `2px solid ${theme.accent}` : '1px solid var(--border)',
                      background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ic}</button>
                ))}
              </div>
              <div className="flex gap-1 flex-wrap mb-4">
                {COLLECTION_COLORS.map(c => (
                  <button key={c} onClick={() => setNewColColor(c)}
                    style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: newColColor === c ? '3px solid var(--text-primary)' : '2px solid transparent', cursor: 'pointer' }} />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowNewCollection(false)} style={{ flex: 1, padding: 10, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13 }}>Cancel</button>
                <button onClick={createCollection} disabled={!newColName.trim()} style={{ flex: 1, padding: 10, borderRadius: 10, background: newColName.trim() ? theme.accent : 'var(--surface)', border: 'none', cursor: newColName.trim() ? 'pointer' : 'not-allowed', color: '#fff', fontSize: 13, fontWeight: 600 }}>Create</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* GALLERY PASSWORD PROMPT */}
      <AnimatePresence>
        {galleryPwPrompt && (
          <MasterPasswordPrompt
            title="Authenticate"
            description="Gallery access requires your master password to decrypt all images."
            onConfirm={() => {
              setGalleryPwPrompt(false)
              setShowGallery(true)
              loadGalleryImages()
            }}
            onCancel={() => setGalleryPwPrompt(false)}
            isDangerous={true}
            warningText="Make sure you are in a safe environment."
          />
        )}
      </AnimatePresence>
    </div>
  )
}
