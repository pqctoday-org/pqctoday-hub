// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useEffect } from 'react'
import { Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FilterDrawerProps {
  filterContent: React.ReactNode
  activeFilterCount: number
  onClearAll: () => void
  /** Label shown on the trigger button (default: "Filters") */
  label?: string
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  filterContent,
  activeFilterCount,
  onClearAll,
  label = 'Filters',
}) => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 shrink-0 ${
          activeFilterCount > 0 ? 'border-primary/50 text-primary bg-primary/10' : ''
        }`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Filter size={15} aria-hidden="true" />
        <span>
          {label}
          {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </span>
      </Button>

      {/* Drawer */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filter options"
          className="fixed inset-0 z-50 flex"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsOpen(false)}
            role="presentation"
          />

          {/* Side panel */}
          <div className="relative ml-auto w-full max-w-sm bg-card border-l border-border shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Filter size={18} className="text-primary" />
                Refine Results
              </h2>
              <Button
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-muted"
                aria-label="Close filters"
              >
                <X size={18} />
              </Button>
            </div>

            {/* Scrollable content */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">{filterContent}</div>

            {/* Footer */}
            <div className="p-6 border-t border-border bg-muted/20 flex gap-3 shrink-0">
              <Button
                variant="ghost"
                onClick={() => {
                  onClearAll()
                }}
                className="flex-1 border border-border bg-background hover:bg-muted font-medium"
              >
                Clear All
              </Button>
              <Button
                variant="gradient"
                onClick={() => setIsOpen(false)}
                className="flex-1 font-bold"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
