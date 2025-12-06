import React, { useMemo, useState } from 'react'
import { libraryData, libraryMetadata } from '../../data/libraryData'
import type { LibraryItem } from '../../data/libraryData'
import { LibraryTreeTable } from './LibraryTreeTable'
import { FilterDropdown } from '../common/FilterDropdown'

export const LibraryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('All')

  const groupedData = useMemo(() => {
    const groups = new Map<string, LibraryItem[]>([
      ['Digital Signature', []],
      ['KEM', []],
      ['PKI Certificate Management', []],
      ['Protocols', []],
      ['General Recommendations', []],
    ])

    libraryData.forEach((item) => {
      const category = item.category || 'General Recommendations'
      if (groups.has(category)) {
        groups.get(category)!.push(item)
      } else {
        // Fallback for unexpected categories
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
        // Check if any of its "parents" (based on dependencies) are in this group.
        // Since we don't have parent pointers, we can check if this item appears in the 'children' list of any OTHER item in this group.

        const isChildOfSomeoneInGroup = itemsInGroup.some((potentialParent) =>
          potentialParent.children?.some((child) => child.referenceId === item.referenceId)
        )

        return !isChildOfSomeoneInGroup
      })
      categoryRoots.set(key, roots)
    })

    return categoryRoots
  }, [])

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

      {/* Dropdown */}
      <FilterDropdown
        items={tabs}
        selectedId={activeTab}
        onSelect={setActiveTab}
        label="Select Category"
        defaultLabel="All"
        className="mb-8"
      />

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
