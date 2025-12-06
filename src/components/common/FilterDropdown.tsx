import React, { useState, useRef, useEffect } from 'react'
import clsx from 'clsx'
import { ChevronDown, Globe } from 'lucide-react'

export interface FilterDropdownItem {
  id: string
  label: string
  icon?: React.ReactNode
}

interface FilterDropdownProps {
  items: (string | FilterDropdownItem)[]
  selectedId: string
  onSelect: (id: string) => void
  label: string
  defaultLabel?: string
  defaultIcon?: React.ReactNode
  className?: string
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  items,
  selectedId,
  onSelect,
  label,
  defaultLabel = 'All',
  defaultIcon = <Globe size={16} className="text-primary" />,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Normalize items
  const normalizedItems = items.map((item) =>
    typeof item === 'string' ? { id: item, label: item, icon: null } : item
  )

  const selectedItem = normalizedItems.find((item) => item.id === selectedId)
  const isDefaultSelected = selectedId === 'All' || !selectedItem

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      buttonRef.current?.focus()
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsOpen(!isOpen)
    }
  }

  const handleOptionKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(id)
      setIsOpen(false)
      buttonRef.current?.focus()
    }
  }

  return (
    <div className={clsx('relative mb-8 z-10', className)} ref={dropdownRef}>
      <div className="glass-panel p-2 inline-flex items-center gap-2">
        <span className="text-muted-foreground px-2" id="filter-dropdown-label">
          {label}:
        </span>
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={() => setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors min-w-[200px] justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  fontWeight: 'bold',
                }}
                aria-hidden="true"
              >
                {isDefaultSelected ? defaultIcon : selectedItem?.icon}
              </span>
              {isDefaultSelected ? defaultLabel : selectedItem?.label}
            </span>
            <ChevronDown
              size={16}
              aria-hidden="true"
              className={clsx('transition-transform', isOpen && 'rotate-180')}
            />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div
              role="listbox"
              aria-labelledby="filter-dropdown-label"
              className="absolute top-full left-0 mt-2 w-full bg-slate-900 border border-white/20 rounded-lg shadow-xl overflow-hidden transform origin-top max-h-60 overflow-y-auto z-50"
            >
              {/* All Option */}
              <button
                role="option"
                aria-selected={isDefaultSelected}
                onClick={() => {
                  onSelect('All')
                  setIsOpen(false)
                }}
                onKeyDown={(e) => handleOptionKeyDown(e, 'All')}
                className={clsx(
                  'w-full text-left px-4 py-3 hover:bg-white/10 transition-colors focus:outline-none focus-visible:bg-white/10 border-b border-white/10',
                  isDefaultSelected ? 'text-primary bg-white/5' : 'text-muted-foreground'
                )}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span
                  className="opacity-50 flex items-center justify-center w-6"
                  aria-hidden="true"
                >
                  {defaultIcon}
                </span>
                {defaultLabel}
              </button>

              {normalizedItems
                .filter((item) => item.id !== 'All')
                .map((item) => (
                  <button
                    key={item.id}
                    role="option"
                    aria-selected={selectedId === item.id}
                    onClick={() => {
                      onSelect(item.id)
                      setIsOpen(false)
                    }}
                    onKeyDown={(e) => handleOptionKeyDown(e, item.id)}
                    className={clsx(
                      'w-full text-left px-4 py-3 hover:bg-white/10 transition-colors focus:outline-none focus-visible:bg-white/10 border-b border-white/10 last:border-0',
                      selectedId === item.id ? 'text-primary bg-white/5' : 'text-muted-foreground'
                    )}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <span
                      className="opacity-80 flex items-center justify-center w-6"
                      aria-hidden="true"
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
