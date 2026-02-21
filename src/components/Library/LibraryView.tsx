import React, { useCallback, useMemo, useState } from 'react'
import {
  libraryData,
  libraryMetadata,
  libraryError,
  LIBRARY_CATEGORIES,
} from '../../data/libraryData'
import type { LibraryItem } from '../../data/libraryData'
import { LibraryTreeTable } from './LibraryTreeTable'
import { LibraryDetailPopover } from './LibraryDetailPopover'
import { ActivityFeed } from './ActivityFeed'
import { CategorySidebar } from './CategorySidebar'
import { DocumentCardGrid } from './DocumentCardGrid'
import { ViewToggle } from './ViewToggle'
import type { ViewMode } from './ViewToggle'
import { SortControl } from './SortControl'
import type { SortOption } from './SortControl'
import { FilterDropdown } from '../common/FilterDropdown'
import { Search, AlertTriangle } from 'lucide-react'
import { SourcesButton } from '../ui/SourcesButton'
import { ShareButton } from '../ui/ShareButton'
import { GlossaryButton } from '../ui/GlossaryButton'
import debounce from 'lodash/debounce'
import { logLibrarySearch, logEvent } from '../../utils/analytics'
import { usePersonaStore } from '../../store/usePersonaStore'

const URGENCY_ORDER: Record<string, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
}

// Maps raw CSV authorsOrOrganization values → canonical standardization body names.
// Only entries present in this map appear as dropdown options (allowlist).
// Sub-groups and working groups roll up to their parent body.
const ORG_CANONICAL_MAP: Record<string, string> = {
  // IETF — all working groups and individual submissions
  'IETF LAMPS': 'IETF',
  'IETF CFRG': 'IETF',
  'IETF TLS WG': 'IETF',
  'IETF IPSECME WG': 'IETF',
  'IETF IPSECME': 'IETF',
  'IETF PQUIP': 'IETF',
  'IETF UTA': 'IETF',
  'IETF OpenPGP WG': 'IETF',
  'IETF COSE WG': 'IETF',
  'IETF Individual Submission': 'IETF',
  // NIST — core body and programs
  NIST: 'NIST',
  'NIST CMVP': 'NIST',
  'NIST NCCoE': 'NIST',
  'NIST/HQC Team': 'NIST',
  // ETSI
  ETSI: 'ETSI',
  'ETSI QSC': 'ETSI',
  // 3GPP
  '3GPP': '3GPP',
  '3GPP SA3': '3GPP',
  // ENISA
  ENISA: 'ENISA',
  'ECCG/ENISA': 'ENISA',
  // NSA / CISA (kept separate — distinct agencies)
  NSA: 'NSA',
  'CISA/NSA': 'CISA/NSA',
  // Open source / industry bodies
  'Open Quantum Safe': 'Open Quantum Safe',
  'Linux Foundation PQCA': 'Open Quantum Safe',
  // Direct mappings — standalone bodies
  'ANSSI France': 'ANSSI France',
  'ASD Australia': 'ASD Australia',
  'BSI Germany': 'BSI Germany',
  'CA/Browser Forum': 'CA/Browser Forum',
  'CACR China': 'CACR China',
  'CCCS Canada': 'CCCS Canada',
  'CCSA China': 'CCSA China',
  'CRYPTREC Japan': 'CRYPTREC Japan',
  'Cloud Security Alliance': 'Cloud Security Alliance',
  'European Commission': 'European Commission',
  GSMA: 'GSMA',
  IEEE: 'IEEE',
  'ICCS China': 'ICCS China',
  'IMDA Singapore': 'IMDA Singapore',
  'ISO/IEC JTC 1/SC 27': 'ISO/IEC JTC 1/SC 27',
  'ITU-T SG17': 'ITU-T SG17',
  KISA: 'KISA',
  'OSCCA China': 'OSCCA China',
  'SAC China': 'SAC China',
  'Trusted Computing Group': 'Trusted Computing Group',
  'UK NCSC': 'UK NCSC',
  'White House': 'White House',
  // Excluded (not in map): 'Browser vendors', 'CAs', 'Ministry of Science and ICT',
  // 'NIS Korea', 'NIS Korea', 'Samsung System LSI', 'Thales'
}

export const LibraryView: React.FC = () => {
  const { selectedIndustry: storeIndustry } = usePersonaStore()
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [activeOrg, setActiveOrg] = useState<string>('All')
  const [activeIndustry, setActiveIndustry] = useState<string>(storeIndustry ?? 'All')
  const [filterText, setFilterText] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetFilter = useCallback(
    debounce((value: string) => {
      setFilterText(value)
      if (value) logLibrarySearch(value)
    }, 200),
    []
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    debouncedSetFilter(e.target.value)
  }

  const handleCategorySelect = (category: string) => {
    setActiveCategory(category)
    logEvent('Library', 'Filter Category', category)
  }

  const industries = useMemo(() => {
    const set = new Set<string>()
    libraryData.forEach((item) => {
      item.applicableIndustries?.forEach((ind) => {
        if (ind) set.add(ind)
      })
    })
    return ['All', ...Array.from(set).sort()]
  }, [])

  const orgs = useMemo(() => {
    const o = new Set<string>()
    libraryData.forEach((item) => {
      if (item.authorsOrOrganization) {
        item.authorsOrOrganization.split(';').forEach((s) => {
          const canonical = ORG_CANONICAL_MAP[s.trim()]
          if (canonical) o.add(canonical)
        })
      }
    })
    return ['All', ...Array.from(o).sort()]
  }, [])

  // Items with New or Updated status for the activity feed
  const activityItems = useMemo(() => {
    return libraryData
      .filter((item) => item.status === 'New' || item.status === 'Updated')
      .sort((a, b) => new Date(b.lastUpdateDate).getTime() - new Date(a.lastUpdateDate).getTime())
  }, [])

  // Category info for the sidebar
  const categoryInfo = useMemo(() => {
    return LIBRARY_CATEGORIES.map((name) => {
      const items = libraryData.filter((item) => item.categories.includes(name))
      return {
        name,
        count: items.length,
        hasUpdates: items.some((item) => item.status === 'New' || item.status === 'Updated'),
      }
    })
  }, [])

  const totalHasUpdates = activityItems.length > 0

  // Filtered items (shared between card and table views)
  const filteredItems = useMemo(() => {
    return libraryData.filter((item) => {
      // Category filter
      if (activeCategory !== 'All' && !item.categories.includes(activeCategory)) {
        return false
      }

      // Industry filter
      if (activeIndustry !== 'All' && !item.applicableIndustries?.includes(activeIndustry)) {
        return false
      }

      // Organization filter — match against canonical names
      if (activeOrg !== 'All') {
        const itemCanonicalOrgs = item.authorsOrOrganization
          ? item.authorsOrOrganization
              .split(';')
              .map((s) => ORG_CANONICAL_MAP[s.trim()])
              .filter(Boolean)
          : []
        if (!itemCanonicalOrgs.includes(activeOrg)) return false
      }

      // Search filter
      if (!filterText) return true
      const searchLower = filterText.toLowerCase()
      return (
        item.documentTitle.toLowerCase().includes(searchLower) ||
        item.referenceId.toLowerCase().includes(searchLower) ||
        item.shortDescription?.toLowerCase().includes(searchLower) ||
        item.categories?.some((cat) => cat.toLowerCase().includes(searchLower))
      )
    })
  }, [activeCategory, activeOrg, activeIndustry, filterText])

  // Sorted items for card view
  const sortedItems = useMemo(() => {
    const items = [...filteredItems]
    switch (sortBy) {
      case 'newest':
        return items.sort(
          (a, b) => new Date(b.lastUpdateDate).getTime() - new Date(a.lastUpdateDate).getTime()
        )
      case 'name':
        return items.sort((a, b) => a.documentTitle.localeCompare(b.documentTitle))
      case 'referenceId':
        return items.sort((a, b) =>
          a.referenceId.localeCompare(b.referenceId, undefined, { numeric: true })
        )
      case 'urgency': {
        return items.sort((a, b) => {
          const aOrder = URGENCY_ORDER[a.migrationUrgency] ?? 99
          const bOrder = URGENCY_ORDER[b.migrationUrgency] ?? 99
          return aOrder - bOrder
        })
      }
      default:
        return items
    }
  }, [filteredItems, sortBy])

  // Grouped data for table view (preserves tree structure)
  const groupedData = useMemo(() => {
    const groups = new Map<string, LibraryItem[]>(LIBRARY_CATEGORIES.map((cat) => [cat, []]))

    filteredItems.forEach((item) => {
      const itemCategories =
        item.categories?.length > 0 ? item.categories : ['General Recommendations']
      itemCategories.forEach((category) => {
        if (groups.has(category)) {
          groups.get(category)!.push(item)
        } else {
          groups.get('General Recommendations')!.push(item)
        }
      })
    })

    // Build root nodes per category
    const categoryRoots = new Map<string, LibraryItem[]>()
    Array.from(groups.keys()).forEach((key) => {
      const itemsInGroup = groups.get(key)!
      const roots = itemsInGroup.filter((item) => {
        const isChildOfSomeoneInGroup = itemsInGroup.some((potentialParent) =>
          potentialParent.children?.some((child) => child.referenceId === item.referenceId)
        )
        return !isChildOfSomeoneInGroup
      })
      categoryRoots.set(key, roots)
    })

    return categoryRoots
  }, [filteredItems])

  const openDetail = (item: LibraryItem) => setSelectedItem(item)

  // Category tabs for mobile dropdown
  const categoryTabs = ['All', ...LIBRARY_CATEGORIES]

  if (libraryError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Unable to Load Library</h2>
        <p className="text-muted-foreground max-w-md">{libraryError}</p>
      </div>
    )
  }

  // Table content: render by category sections or single category
  const renderTableView = () => {
    const sections = activeCategory === 'All' ? [...LIBRARY_CATEGORIES] : [activeCategory]

    return (
      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section} className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground border-b border-white/10 pb-2">
              {section}
            </h3>
            {(groupedData.get(section)?.length ?? 0) > 0 ? (
              <LibraryTreeTable
                data={groupedData.get(section)!}
                defaultSort={{ key: 'lastUpdateDate', direction: 'desc' }}
                defaultExpandAll={false}
              />
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No documents found in this section.
              </p>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="text-center mb-2 md:mb-8">
        <h2 className="text-lg md:text-4xl font-bold mb-1 md:mb-4 text-gradient">
          PQC Standards Library
        </h2>
        <p className="hidden lg:block text-muted-foreground max-w-2xl mx-auto mb-4">
          Explore the latest Post-Quantum Cryptography standards, drafts, and related documents.
        </p>
        {libraryMetadata && (
          <div className="hidden lg:flex items-center justify-center gap-3 text-[10px] md:text-xs text-muted-foreground/60 font-mono">
            <p>
              Data Source: {libraryMetadata.filename} • Updated:{' '}
              {libraryMetadata.lastUpdate.toLocaleDateString()}
            </p>
            <SourcesButton viewType="Library" />
            <ShareButton
              title="PQC Standards Library — NIST, IETF, ETSI & More"
              text="Explore post-quantum cryptography standards, drafts, and key documents from NIST, IETF, ETSI, and other organizations."
            />
            <GlossaryButton />
          </div>
        )}
      </div>

      {/* Zone 1: Activity Feed */}
      <ActivityFeed items={activityItems} onSelect={openDetail} />

      {/* Zone 2 + Zone 3: Sidebar + Main Content */}
      <div className="flex gap-6 items-start">
        {/* Zone 2: Category Sidebar (desktop) */}
        <CategorySidebar
          categories={categoryInfo}
          active={activeCategory}
          onSelect={handleCategorySelect}
          totalCount={libraryData.length}
          totalHasUpdates={totalHasUpdates}
        />

        {/* Zone 3: Main Content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Controls Bar */}
          <div className="bg-card border border-border rounded-lg shadow-lg p-2 flex flex-col md:flex-row items-center gap-3">
            {/* Mobile: Category dropdown (hidden on lg where sidebar shows) */}
            <div className="flex items-center gap-2 w-full lg:hidden text-xs">
              <div className="flex-1 min-w-[150px]">
                <FilterDropdown
                  items={categoryTabs}
                  selectedId={activeCategory}
                  onSelect={handleCategorySelect}
                  defaultLabel="Category"
                  noContainer
                  opaque
                  className="mb-0 w-full"
                />
              </div>
            </div>

            {/* Org + Search + Sort + ViewToggle */}
            <div className="flex items-center gap-2 w-full text-xs">
              <div className="min-w-[140px]">
                <FilterDropdown
                  items={orgs}
                  selectedId={activeOrg}
                  onSelect={(org) => {
                    setActiveOrg(org)
                    logEvent('Library', 'Filter Org', org)
                  }}
                  defaultLabel="Organization"
                  noContainer
                  opaque
                  className="mb-0 w-full"
                />
              </div>

              <div className="min-w-[140px]">
                <FilterDropdown
                  items={industries}
                  selectedId={activeIndustry}
                  onSelect={(ind) => {
                    setActiveIndustry(ind)
                    logEvent('Library', 'Filter Industry', ind)
                  }}
                  defaultLabel="Industry"
                  noContainer
                  opaque
                  className="mb-0 w-full"
                />
              </div>

              <div className="relative flex-1 min-w-[140px]">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  id="library-search"
                  placeholder="Search standards..."
                  aria-label="Search PQC standards library"
                  value={inputValue}
                  onChange={handleSearchChange}
                  className="bg-muted/30 hover:bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 w-full transition-colors text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {viewMode === 'cards' && <SortControl value={sortBy} onChange={setSortBy} />}

              <ViewToggle mode={viewMode} onChange={setViewMode} />
            </div>
          </div>

          {/* Results count */}
          <p className="text-xs text-muted-foreground">
            {filteredItems.length} document{filteredItems.length !== 1 ? 's' : ''}
            {activeCategory !== 'All' && ` in ${activeCategory}`}
          </p>

          {/* Content area */}
          {viewMode === 'cards' ? (
            <DocumentCardGrid items={sortedItems} onViewDetails={openDetail} />
          ) : (
            renderTableView()
          )}
        </div>
      </div>

      {/* Detail Popover */}
      <LibraryDetailPopover
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
      />
    </div>
  )
}
