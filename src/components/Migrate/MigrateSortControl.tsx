// SPDX-License-Identifier: GPL-3.0-only
import { ArrowUpDown } from 'lucide-react'
import clsx from 'clsx'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'

export type MigrateSortOption = 'name' | 'pqcSupport' | 'pqcMigrationPriority' | 'fipsValidated'

interface MigrateSortControlProps {
  value: MigrateSortOption
  onChange: (value: MigrateSortOption) => void
}

const SORT_OPTIONS: { id: MigrateSortOption; label: string }[] = [
  { id: 'name', label: 'Name A-Z' },
  { id: 'pqcSupport', label: 'PQC Support' },
  { id: 'pqcMigrationPriority', label: 'Migration Priority' },
  { id: 'fipsValidated', label: 'FIPS Status' },
]

export const MigrateSortControl = ({ value, onChange }: MigrateSortControlProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])

  const selected = SORT_OPTIONS.find((o) => o.id === value)

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && isOpen) {
            e.preventDefault()
            setIsOpen(false)
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowUpDown size={14} aria-hidden="true" />
        <span className="hidden sm:inline">{selected?.label ?? 'Sort'}</span>
      </Button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Sort by"
          className="absolute top-full right-0 mt-1 w-44 bg-popover border border-border rounded-lg shadow-xl overflow-hidden z-50"
        >
          {SORT_OPTIONS.map((option) => (
            <Button
              variant="ghost"
              key={option.id}
              role="option"
              aria-selected={value === option.id}
              onClick={() => {
                onChange(option.id)
                setIsOpen(false)
              }}
              className={clsx(
                'w-full text-left px-3 py-2 text-xs hover:bg-muted/50 transition-colors border-b border-border last:border-0',
                value === option.id ? 'text-primary bg-muted/30' : 'text-muted-foreground'
              )}
            >
              {option.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
