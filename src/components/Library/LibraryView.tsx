// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import { Search, FileSearch, BookOpen } from 'lucide-react'
import { PageHeader } from '../common/PageHeader'
import { generateCsv, downloadCsv, csvFilename } from '@/utils/csvExport'
import { LIBRARY_CSV_COLUMNS } from '@/utils/csvExportConfigs'
import debounce from 'lodash/debounce'
import { logLibrarySearch, logEvent } from '../../utils/analytics'
import { usePersonaStore } from '../../store/usePersonaStore'
import { PERSONA_LIBRARY_CATEGORIES } from '../../data/personaConfig'
import { ErrorAlert } from '../ui/error-alert'
import { EmptyState } from '../ui/empty-state'

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

// Maps raw CSV applicable_industries values → canonical industry names (matching AVAILABLE_INDUSTRIES).
// Normalizes aliases, abbreviations, and sub-categories so the dropdown shows clean canonical names
// and persona-selected industry (e.g. "Finance & Banking") correctly matches library documents.
// Tags not in this map are excluded from the dropdown but still matched under "All".
// Note: Automotive, Aerospace, Retail & E-Commerce have no tagged documents yet — they won't appear.
const INDUSTRY_CANONICAL_MAP: Record<string, string> = {
  // Finance & Banking
  Finance: 'Finance & Banking',
  Banking: 'Finance & Banking',
  'Finance & Banking': 'Finance & Banking',

  // Government & Defense
  Government: 'Government & Defense',
  Gov: 'Government & Defense',
  'Federal Government': 'Government & Defense',
  Defense: 'Government & Defense',
  'Government & Defense': 'Government & Defense',

  // Healthcare
  Healthcare: 'Healthcare',
  'Regulated industries': 'Healthcare',
  Pharmaceutical: 'Healthcare',

  // Telecommunications
  Telecom: 'Telecommunications',
  Telecommunications: 'Telecommunications',
  'Mobile Networks': 'Telecommunications',
  '5G': 'Telecommunications',
  GSMA: 'Telecommunications',

  // Technology
  IT: 'Technology',
  'Software Development': 'Technology',
  Enterprise: 'Technology',
  'Enterprise IT': 'Technology',
  Cloud: 'Technology',
  'Cloud Security': 'Technology',
  Web: 'Technology',
  'Web APIs': 'Technology',
  IoT: 'Technology',
  'Embedded Systems': 'Technology',
  Firmware: 'Technology',
  'Hardware Security': 'Technology',
  'HSM Vendors': 'Technology',
  'Certificate Authorities': 'Technology',
  'Web PKI': 'Technology',
  PKI: 'Technology',
  'ICT Products': 'Technology',
  Protocol: 'Technology',
  'Data Protection': 'Technology',
  'Identity Management': 'Technology',
  'Secure Messaging': 'Technology',
  Messaging: 'Technology',
  Email: 'Technology',
  'Email Security': 'Technology',
  'Document Signing': 'Technology',
  VPN: 'Technology',
  'Remote Access': 'Technology',
  DNS: 'Technology',
  'Constrained Devices': 'Technology',

  // Energy & Utilities
  'Critical Infrastructure': 'Energy & Utilities',
  Energy: 'Energy & Utilities',
  'Energy & Utilities': 'Energy & Utilities',

  // Education
  Research: 'Education',
  Academia: 'Education',
  'Cryptography Research': 'Education',

  // Long-term Archival — loosely Technology or Government; map to Technology
  Archival: 'Technology',
  'Long-term Archival': 'Technology',
  'High Security': 'Technology',

  // Catch-alls (skip in dropdown — appear under "All")
  'All industries': 'All',
  Global: 'All',
  Mobile: 'All',
}

/** Find a library item by referenceId, searching top-level and nested children */
function findByRef(
  items: LibraryItem[],
  refId: string,
  visited = new Set<string>()
): LibraryItem | null {
  for (const item of items) {
    if (visited.has(item.referenceId)) continue
    visited.add(item.referenceId)
    if (item.referenceId === refId) return item
    if (item.children) {
      const found = findByRef(item.children, refId, visited)
      if (found) return found
    }
  }
  return null
}

export const LibraryView: React.FC = () => {
  const [searchParams] = useSearchParams()
  const { selectedIndustry: storeIndustry, selectedPersona } = usePersonaStore()
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [activeOrg, setActiveOrg] = useState<string>('All')
  const [activeIndustry, setActiveIndustry] = useState<string>(storeIndustry ?? 'All')
  const [filterText, setFilterText] = useState(() => searchParams.get('q') ?? '')
  const [inputValue, setInputValue] = useState(() => searchParams.get('q') ?? '')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(() => {
    const ref = searchParams.get('ref')
    return ref ? findByRef(libraryData, ref) : null
  })

  // Sync ?q= and ?ref= params on same-route navigations (e.g. chatbot deep links)
  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      const found = findByRef(libraryData, ref)
      if (found) setSelectedItem(found)
      return // ?ref= takes priority over ?q=
    }
    const q = searchParams.get('q')
    if (q !== null) {
      setFilterText(q)
      setInputValue(q)
    }
  }, [searchParams])

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
        const canonical = INDUSTRY_CANONICAL_MAP[ind?.trim()]
        if (canonical && canonical !== 'All') set.add(canonical)
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

      // Industry filter — match via canonical map to normalize CSV aliases.
      // Items with no industry tags, or tagged "All industries"/"Global", are universally
      // applicable and pass through regardless of the selected industry.
      if (activeIndustry !== 'All') {
        const itemCanonicals =
          item.applicableIndustries
            ?.map((ind) => INDUSTRY_CANONICAL_MAP[ind?.trim()])
            .filter(Boolean) ?? []
        if (
          itemCanonicals.length > 0 &&
          !itemCanonicals.includes('All') &&
          !itemCanonicals.includes(activeIndustry)
        )
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

  // Persona-preferred categories for secondary sort boost
  const preferredCategories = useMemo(() => {
    if (!selectedPersona) return []
    return PERSONA_LIBRARY_CATEGORIES[selectedPersona] ?? [] // eslint-disable-line security/detect-object-injection
  }, [selectedPersona])

  // Sorted items for card view — persona-preferred categories float to top
  const sortedItems = useMemo(() => {
    const items = [...filteredItems]
    switch (sortBy) {
      case 'newest':
        items.sort(
          (a, b) => new Date(b.lastUpdateDate).getTime() - new Date(a.lastUpdateDate).getTime()
        )
        break
      case 'name':
        items.sort((a, b) => a.documentTitle.localeCompare(b.documentTitle))
        break
      case 'referenceId':
        items.sort((a, b) =>
          a.referenceId.localeCompare(b.referenceId, undefined, { numeric: true })
        )
        break
      case 'urgency':
        items.sort((a, b) => {
          const aOrder = URGENCY_ORDER[a.migrationUrgency] ?? 99
          const bOrder = URGENCY_ORDER[b.migrationUrgency] ?? 99
          return aOrder - bOrder
        })
        break
    }

    // Secondary: float persona-preferred categories to top (stable sort)
    if (preferredCategories.length > 0) {
      items.sort((a, b) => {
        const aMatch = a.categories?.some((c) => preferredCategories.includes(c)) ? 0 : 1
        const bMatch = b.categories?.some((c) => preferredCategories.includes(c)) ? 0 : 1
        return aMatch - bMatch
      })
    }

    return items
  }, [filteredItems, sortBy, preferredCategories])

  const handleExportCsv = useCallback(() => {
    const csv = generateCsv(sortedItems, LIBRARY_CSV_COLUMNS)
    downloadCsv(csv, csvFilename('pqc-library'))
  }, [sortedItems])

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
    return <ErrorAlert message={libraryError} />
  }

  // Table content: render by category sections or single category
  const renderTableView = () => {
    const sections = activeCategory === 'All' ? [...LIBRARY_CATEGORIES] : [activeCategory]

    return (
      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section} className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              {section}
            </h3>
            {(groupedData.get(section)?.length ?? 0) > 0 ? (
              <LibraryTreeTable
                data={groupedData.get(section)!}
                defaultSort={{ key: 'lastUpdateDate', direction: 'desc' }}
                defaultExpandAll={false}
              />
            ) : (
              <EmptyState
                icon={<FileSearch size={32} />}
                title="No documents found"
                description="Try adjusting your search or filter criteria."
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BookOpen}
        title="PQC Library"
        description="Explore the latest Post-Quantum Cryptography standards, drafts, and related documents."
        dataSource={
          libraryMetadata
            ? `${libraryMetadata.filename} • Updated: ${libraryMetadata.lastUpdate.toLocaleDateString()}`
            : undefined
        }
        viewType="Library"
        shareTitle="PQC Library — NIST, IETF, ETSI & More"
        shareText="Explore post-quantum cryptography standards, drafts, and key documents from NIST, IETF, ETSI, and other organizations."
        onExport={handleExportCsv}
      />

      {/* Zone 1: Activity Feed */}
      <ActivityFeed items={activityItems} onSelect={openDetail} />

      {/* Category pills (desktop) */}
      <CategorySidebar
        categories={categoryInfo}
        active={activeCategory}
        onSelect={handleCategorySelect}
        totalCount={libraryData.length}
        totalHasUpdates={totalHasUpdates}
      />

      {/* Controls Bar */}
      <div className="bg-card border border-border rounded-lg shadow-lg p-2 flex flex-col md:flex-row items-center gap-3">
        {/* Mobile: Category dropdown (hidden on lg where pills show) */}
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
        <div className="flex flex-wrap items-center gap-2 w-full text-xs">
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
              className="bg-muted/30 hover:bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 min-h-[44px] text-sm focus:outline-none focus:border-primary/50 w-full transition-colors text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {viewMode === 'cards' && <SortControl value={sortBy} onChange={setSortBy} />}

          <div className="hidden md:block">
            <ViewToggle mode={viewMode} onChange={setViewMode} />
          </div>
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
        <>
          <div className="hidden md:block">{renderTableView()}</div>
          <div className="md:hidden">
            <DocumentCardGrid items={sortedItems} onViewDetails={openDetail} />
          </div>
        </>
      )}

      {/* Detail Popover */}
      <LibraryDetailPopover
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
      />
    </div>
  )
}
