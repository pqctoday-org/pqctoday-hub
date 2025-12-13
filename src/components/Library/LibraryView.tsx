import React, { useMemo, useState } from 'react'
import { libraryData, libraryMetadata } from '../../data/libraryData'
import type { LibraryItem } from '../../data/libraryData'
import { LibraryTreeTable } from './LibraryTreeTable'
import { FilterDropdown } from '../common/FilterDropdown'
import { Search } from 'lucide-react'

export const LibraryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('All')
  const [activeRegion, setActiveRegion] = useState<string>('All')
  const [filterText, setFilterText] = useState('')

  const regions = useMemo(() => {
    const r = new Set<string>()
    libraryData.forEach((item) => {
      if (item.regionScope) {
        item.regionScope.split(',').forEach((s) => r.add(s.trim()))
      }
    })
    return ['All', ...Array.from(r).sort()]
  }, [])

  const groupedData = useMemo(() => {
    // First filter the data based on search text and region
    const filteredData = libraryData.filter((item) => {
      // Region Filter
      if (activeRegion !== 'All') {
        if (!item.regionScope || !item.regionScope.includes(activeRegion)) return false
      }

      if (!filterText) return true
      const searchLower = filterText.toLowerCase()
      return (
        item.documentTitle.toLowerCase().includes(searchLower) ||
        item.referenceId.toLowerCase().includes(searchLower) ||
        item.shortDescription?.toLowerCase().includes(searchLower) ||
        item.category?.toLowerCase().includes(searchLower)
      )
    })

    const groups = new Map<string, LibraryItem[]>([
      ['Digital Signature', []],
      ['KEM', []],
      ['PKI Certificate Management', []],
      ['Protocols', []],
      ['General Recommendations', []],
    ])

    filteredData.forEach((item) => {
      const category = item.category || 'General Recommendations'
      if (groups.has(category)) {
        groups.get(category)!.push(item)
      } else {
        groups.get('General Recommendations')!.push(item)
      }
    })

    const categoryRoots = new Map<string, LibraryItem[]>([
      ['Digital Signature', []],
      ['KEM', []],
      ['PKI Certificate Management', []],
      ['Protocols', []],
      ['General Recommendations', []],
    ])

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
  }, [filterText, activeRegion])

  const sections = [
    'Digital Signature',
    'KEM',
    'PKI Certificate Management',
    'Protocols',
    'General Recommendations',
  ]

  const tabs = ['All', ...sections]

  return (
    <div className="space-y-8">
      <div className="text-center mb-2 md:mb-12">
        <h2 className="text-lg md:text-4xl font-bold mb-1 md:mb-4 text-gradient">
          PQC Standards Library
        </h2>
        <p className="hidden lg:block text-muted-foreground max-w-2xl mx-auto mb-4">
          Explore the latest Post-Quantum Cryptography standards, drafts, and related documents.
        </p>
        {libraryMetadata && (
          <p className="hidden lg:block text-[10px] md:text-xs text-muted-foreground/60 font-mono">
            Data Source: {libraryMetadata.filename} • Updated:{' '}
            {libraryMetadata.lastUpdate.toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Controls Container */}
      <div className="bg-card border border-border rounded-lg shadow-lg p-2 mb-8 flex flex-col md:flex-row items-center gap-4">
        {/* Mobile: Filters on one row */}
        <div className="flex items-center gap-2 w-full md:w-auto text-xs">
          {/* Category Dropdown */}
          <div className="flex-1 min-w-[150px]">
            <FilterDropdown
              items={tabs}
              selectedId={activeTab}
              onSelect={setActiveTab}
              defaultLabel="Category"
              noContainer
              opaque
              className="mb-0 w-full"
            />
          </div>

          {/* Region Dropdown */}
          <div className="flex-1 min-w-[120px]">
            <FilterDropdown
              items={regions}
              selectedId={activeRegion}
              onSelect={setActiveRegion}
              defaultLabel="Region"
              noContainer
              opaque
              className="mb-0 w-full"
            />
          </div>
        </div>

        <span className="hidden md:inline text-muted-foreground px-2">Search:</span>
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] w-full">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search standards..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="bg-muted/30 hover:bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 w-full transition-colors text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-8">
        {activeTab === 'All' ? (
          <div role="tabpanel" id="panel-All" aria-labelledby="tab-All">
            {sections.map((section) => (
              <div key={section} className="space-y-4 mb-8">
                <h3 className="text-xl font-semibold text-foreground border-b border-white/10 pb-2">
                  {section}
                </h3>
                {(groupedData.get(section)?.length ?? 0) > 0 ? (
                  <LibraryTreeTable
                    data={groupedData.get(section)!}
                    defaultSort={{ key: 'lastUpdateDate', direction: 'desc' }}
                    defaultExpandAll={true}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No documents found in this section.
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div
            role="tabpanel"
            id={`panel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            className="space-y-4"
          >
            <h3 className="text-xl font-semibold text-foreground border-b border-white/10 pb-2">
              {activeTab}
            </h3>
            {(groupedData.get(activeTab)?.length ?? 0) > 0 ? (
              <LibraryTreeTable
                data={groupedData.get(activeTab)!}
                defaultSort={{ key: 'lastUpdateDate', direction: 'desc' }}
                defaultExpandAll={true}
              />
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No documents found in this section.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
