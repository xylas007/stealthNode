// ═══════════════════════════════════════════════════════════
// StealthNode — Vault Store (Zustand)
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand'
import type { VaultEntry, Collection, EntryCategory, FilterType, ViewMode } from '../../shared/types'

interface VaultState {
  entries: any[]
  trashEntries: any[]
  collections: Collection[]
  activeCategory: EntryCategory | null
  activeFolderId: string | null
  activeFilter: FilterType | 'trash'
  viewMode: ViewMode
  searchQuery: string
  selectedEntryId: string | null
  showAddModal: boolean
  showCategorySelect: boolean
  showDetailPanel: boolean
  editingEntryId: string | null

  setEntries: (entries: any[]) => void
  setCollections: (collections: Collection[]) => void
  setActiveCategory: (cat: EntryCategory | null) => void
  setActiveFolderId: (id: string | null) => void
  setActiveFilter: (filter: FilterType | 'trash') => void
  setViewMode: (mode: ViewMode) => void
  setSearchQuery: (query: string) => void
  setSelectedEntryId: (id: string | null) => void
  setShowAddModal: (show: boolean) => void
  setShowCategorySelect: (show: boolean) => void
  setShowDetailPanel: (show: boolean) => void
  setEditingEntryId: (id: string | null) => void
  refreshEntries: () => Promise<void>
  refreshCollections: () => Promise<void>
  refreshTrash: () => Promise<void>
}

export const useVaultStore = create<VaultState>((set, get) => ({
  entries: [],
  trashEntries: [],
  collections: [],
  activeCategory: null,
  activeFolderId: null,
  activeFilter: 'all',
  viewMode: 'grid',
  searchQuery: '',
  selectedEntryId: null,
  showAddModal: false,
  showCategorySelect: false,
  showDetailPanel: false,
  editingEntryId: null,

  setEntries: (entries) => set({ entries }),
  setCollections: (collections) => set({ collections }),
  setActiveCategory: (cat) => set({ activeCategory: cat, activeFolderId: null }),
  setActiveFolderId: (id) => set({ activeFolderId: id, activeCategory: null }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedEntryId: (id) => set({ selectedEntryId: id, showDetailPanel: !!id }),
  setShowAddModal: (show) => set({ showAddModal: show }),
  setShowCategorySelect: (show) => set({ showCategorySelect: show }),
  setShowDetailPanel: (show) => set({ showDetailPanel: show }),
  setEditingEntryId: (id) => set({ editingEntryId: id }),

  refreshEntries: async () => {
    try {
      const entries = await window.stealthNode.getEntries()
      set({ entries })
    } catch { set({ entries: [] }) }
  },

  refreshCollections: async () => {
    try {
      const collections = await window.stealthNode.getCollections()
      set({ collections })
    } catch { set({ collections: [] }) }
  },

  refreshTrash: async () => {
    try {
      const trashEntries = await window.stealthNode.getTrashEntries()
      set({ trashEntries })
    } catch { set({ trashEntries: [] }) }
  }
}))
