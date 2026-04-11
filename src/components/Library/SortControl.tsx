// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable react-refresh/only-export-components */
import { ArrowUpDown } from 'lucide-react'
import clsx from 'clsx'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'

export type SortOption = 'newest' | 'name' | 'referenceId' | 'urgency'

export const LIBRARY_SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'newest', label: 'Newest first' },
  { id: 'name', label: 'Name A-Z' },
  { id: 'referenceId', label: 'Reference ID' },
  { id: 'urgency', label: 'Urgency' },
]

interface SortControlProps<T extends string = SortOption> {
  value: T
  onChange: (value: T) => void
  options?: { id: T; label: string }[]
}

export function SortControl<T extends string = SortOption>({
  value,
  onChange,
  options,
}: SortControlProps<T>) {
  const items = (options ?? LIBRARY_SORT_OPTIONS) as { id: T; label: string }[]
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const selected = items.find((o) => o.id === value)

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
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
          className="absolute top-full right-0 mt-1 w-40 bg-popover border border-border rounded-lg shadow-xl overflow-hidden z-50"
        >
          {items.map((option) => (
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
