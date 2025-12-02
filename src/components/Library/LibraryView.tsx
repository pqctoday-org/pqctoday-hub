import React, { useMemo, useState } from 'react'
import { libraryData } from '../../data/libraryData'
import type { LibraryItem } from '../../data/libraryData'
import { LibraryTreeTable } from './LibraryTreeTable'
import clsx from 'clsx'

export const LibraryView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string>('All')

    const groupedData = useMemo(() => {
        const groups: Record<string, LibraryItem[]> = {
            'Digital Signature': [],
            'KEM': [],
            'PKI Certificate Management': [],
            'Protocols': [],
            'General Recommendations': [],
        }

        libraryData.forEach(item => {
            const category = item.category || 'General Recommendations'
            if (groups[category]) {
                groups[category].push(item)
            } else {
                // Fallback for unexpected categories
                groups['General Recommendations'].push(item)
            }
        })

        const categoryRoots: Record<string, LibraryItem[]> = {
            'Digital Signature': [],
            'KEM': [],
            'PKI Certificate Management': [],
            'Protocols': [],
            'General Recommendations': [],
        }

        Object.keys(groups).forEach(key => {
            const itemsInGroup = groups[key]

            categoryRoots[key] = itemsInGroup.filter(item => {
                // Check if any of its "parents" (based on dependencies) are in this group.
                // Since we don't have parent pointers, we can check if this item appears in the 'children' list of any OTHER item in this group.

                const isChildOfSomeoneInGroup = itemsInGroup.some(potentialParent =>
                    potentialParent.children?.some(child => child.referenceId === item.referenceId)
                )

                return !isChildOfSomeoneInGroup
            })
        })

        return categoryRoots
    }, [])

    const sections = [
        'Digital Signature',
        'KEM',
        'PKI Certificate Management',
        'Protocols',
        'General Recommendations'
    ]

    const tabs = ['All', ...sections]

    const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'ArrowRight') {
            setActiveTab(tabs[(index + 1) % tabs.length])
            document.getElementById(`tab-${tabs[(index + 1) % tabs.length]}`)?.focus()
        } else if (e.key === 'ArrowLeft') {
            setActiveTab(tabs[(index - 1 + tabs.length) % tabs.length])
            document.getElementById(`tab-${tabs[(index - 1 + tabs.length) % tabs.length]}`)?.focus()
        } else if (e.key === 'Home') {
            setActiveTab(tabs[0])
            document.getElementById(`tab-${tabs[0]}`)?.focus()
        } else if (e.key === 'End') {
            setActiveTab(tabs[tabs.length - 1])
            document.getElementById(`tab-${tabs[tabs.length - 1]}`)?.focus()
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold text-gradient">PQC Standards Library</h2>
                <p className="text-muted">
                    Explore the latest Post-Quantum Cryptography standards, drafts, and related documents.
                </p>
            </div>

            {/* Tabs */}
            <div role="tablist" className="flex flex-wrap gap-2 border-b border-white/10 pb-1" aria-label="Library Categories">
                {tabs.map((tab, index) => (
                    <button
                        key={tab}
                        id={`tab-${tab}`}
                        role="tab"
                        aria-selected={activeTab === tab}
                        aria-controls={`panel-${tab}`}
                        tabIndex={activeTab === tab ? 0 : -1}
                        onClick={() => setActiveTab(tab)}
                        onKeyDown={(e) => handleTabKeyDown(e, index)}
                        className={clsx(
                            'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary',
                            activeTab === tab
                                ? 'bg-white/10 text-white border-b-2 border-primary'
                                : 'text-muted hover:text-white hover:bg-white/5'
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="space-y-8">
                {activeTab === 'All' ? (
                    <div role="tabpanel" id="panel-All" aria-labelledby="tab-All">
                        {sections.map(section => (
                            <div key={section} className="space-y-4 mb-8">
                                <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-2">{section}</h3>
                                {groupedData[section]?.length > 0 ? (
                                    <LibraryTreeTable
                                        data={groupedData[section]}
                                        defaultSort={{ key: 'lastUpdateDate', direction: 'desc' }}
                                    />
                                ) : (
                                    <p className="text-sm text-muted italic">No documents found in this section.</p>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} className="space-y-4">
                        <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-2">{activeTab}</h3>
                        {groupedData[activeTab]?.length > 0 ? (
                            <LibraryTreeTable
                                data={groupedData[activeTab]}
                                defaultSort={{ key: 'lastUpdateDate', direction: 'desc' }}
                            />
                        ) : (
                            <p className="text-sm text-muted italic">No documents found in this section.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
