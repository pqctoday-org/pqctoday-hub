import React, { useState, useEffect } from 'react'
import { Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MobileFilterDrawerProps {
  // We'll pass the exact same props as the dropdowns
  filterContent: React.ReactNode
  activeFilterCount: number
  onClearAll: () => void
}

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  filterContent,
  activeFilterCount,
  onClearAll,
}) => {
  const [isOpen, setIsOpen] = useState(false)

  // Disallow body scrolling when drawer is open
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
    <div className="md:hidden">
      {/* Trigger Button */}
      <Button
        variant="ghost"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-4 py-2 w-full justify-between rounded-lg border transition-colors min-h-[44px] ${
          activeFilterCount > 0
            ? 'bg-primary/10 text-primary border-primary/30'
            : 'bg-muted/30 text-foreground border-border hover:bg-muted/50'
        }`}
      >
        <div className="flex items-center gap-2 font-medium">
          <Filter size={18} />
          <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
        </div>
        {activeFilterCount > 0 && (
          <div
            role="button"
            tabIndex={0}
            className="text-xs bg-background rounded-full px-2 py-0.5 border"
            onClick={(e) => {
              e.stopPropagation()
              onClearAll()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation()
                onClearAll()
              }
            }}
          >
            Clear
          </div>
        )}
      </Button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 embed-backdrop z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setIsOpen(false)}
            role="presentation"
          />

          {/* Bottom Sheet */}
          <div className="relative bg-card border-t border-border rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[85vh] flex flex-col">
            {/* Drawer Handle */}
            <div className="w-full flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-muted rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Filter size={20} className="text-primary" />
                Refine Results
              </h2>
              <Button
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
                aria-label="Close filters"
              >
                <X size={20} />
              </Button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">{filterContent}</div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-border/50 bg-muted/20 flex gap-4">
              <Button
                variant="ghost"
                onClick={() => {
                  onClearAll()
                }}
                className="flex-1 py-3 px-4 rounded-lg border border-border bg-background hover:bg-muted font-medium transition-colors"
              >
                Clear All
              </Button>
              <Button
                variant="gradient"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-3 px-4 rounded-lg font-bold hover:brightness-110 transition-all shadow-md shadow-primary/20"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
