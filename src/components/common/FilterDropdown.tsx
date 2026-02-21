import React, { useState, useRef, useEffect } from 'react'
import clsx from 'clsx'
import { ChevronDown, Globe, Check } from 'lucide-react'

export interface FilterDropdownItem {
  id: string
  label: string
  icon?: React.ReactNode
}

interface FilterDropdownProps {
  items: (string | FilterDropdownItem)[]
  selectedId: string
  onSelect: (id: string) => void
  label?: string
  defaultLabel?: string
  defaultIcon?: React.ReactNode
  className?: string
  opaque?: boolean
  noContainer?: boolean
  variant?: 'default' | 'ghost'
  // Multi-select mode — provide both props to enable
  multiSelectedIds?: string[]
  onMultiSelect?: (ids: string[]) => void
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  items,
  selectedId,
  onSelect,
  label,
  defaultLabel = 'All',
  defaultIcon = <Globe size={16} className="text-primary" />,
  className,
  opaque = false,
  noContainer = false,
  variant = 'default',
  multiSelectedIds,
  onMultiSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const isMulti = multiSelectedIds !== undefined && onMultiSelect !== undefined

  // Normalize items
  const normalizedItems = items.map((item) =>
    typeof item === 'string' ? { id: item, label: item, icon: null } : item
  )

  // Single-select helpers
  const selectedItem = normalizedItems.find((item) => item.id === selectedId)
  const isDefaultSelected = selectedId === 'All' || !selectedItem

  // Multi-select helpers
  const multiCount = multiSelectedIds?.length ?? 0
  const multiButtonLabel =
    multiCount === 0
      ? defaultLabel
      : multiCount === 1
        ? (normalizedItems.find((i) => i.id === multiSelectedIds![0])?.label ?? defaultLabel)
        : `${multiCount} selected`
  const multiButtonIcon =
    multiCount === 1
      ? (normalizedItems.find((i) => i.id === multiSelectedIds![0])?.icon ?? defaultIcon)
      : defaultIcon

  const handleMultiToggle = (id: string) => {
    if (!multiSelectedIds || !onMultiSelect) return
    if (id === 'All') {
      onMultiSelect([])
      return
    }
    const next = multiSelectedIds.includes(id)
      ? multiSelectedIds.filter((x) => x !== id)
      : [...multiSelectedIds, id]
    onMultiSelect(next)
  }

  // Generate unique ID for label
  const labelId = label
    ? `filter-dropdown-label-${label.replace(/\s+/g, '-').toLowerCase()}`
    : undefined

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
      if (isMulti) {
        handleMultiToggle(id)
      } else {
        onSelect(id)
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }
  }

  const renderMenu = () => (
    <div
      role="listbox"
      aria-labelledby={labelId}
      aria-multiselectable={isMulti}
      className="absolute top-full left-0 mt-2 min-w-full bg-popover border border-border rounded-lg shadow-xl overflow-hidden transform origin-top max-h-60 overflow-y-auto z-50"
    >
      {/* All / Clear Option */}
      <button
        role="option"
        aria-selected={isMulti ? multiCount === 0 : isDefaultSelected}
        onClick={() => {
          if (isMulti) {
            handleMultiToggle('All')
          } else {
            onSelect('All')
            setIsOpen(false)
          }
        }}
        onKeyDown={(e) => handleOptionKeyDown(e, 'All')}
        className={clsx(
          'w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors focus:outline-none focus-visible:bg-muted/50 border-b border-border flex items-center gap-2',
          (isMulti ? multiCount === 0 : isDefaultSelected)
            ? 'text-primary bg-muted/30'
            : 'text-muted-foreground'
        )}
      >
        <span className="opacity-50 flex items-center justify-center w-6" aria-hidden="true">
          {defaultIcon}
        </span>
        {defaultLabel}
        {isMulti && multiCount === 0 && (
          <Check size={12} className="ml-auto text-primary" aria-hidden="true" />
        )}
      </button>

      {normalizedItems
        .filter((item) => item.id !== 'All')
        .map((item) => {
          const isSelected = isMulti
            ? (multiSelectedIds?.includes(item.id) ?? false)
            : selectedId === item.id
          return (
            <button
              key={item.id}
              role="option"
              aria-selected={isSelected}
              onClick={() => {
                if (isMulti) {
                  handleMultiToggle(item.id)
                } else {
                  onSelect(item.id)
                  setIsOpen(false)
                }
              }}
              onKeyDown={(e) => handleOptionKeyDown(e, item.id)}
              className={clsx(
                'w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors focus:outline-none focus-visible:bg-muted/50 border-b border-border last:border-0 flex items-center gap-2',
                isSelected ? 'text-primary bg-muted/30' : 'text-muted-foreground'
              )}
            >
              <span className="opacity-80 flex items-center justify-center w-6" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
              {isMulti && isSelected && (
                <Check size={12} className="ml-auto text-primary" aria-hidden="true" />
              )}
            </button>
          )
        })}
    </div>
  )

  const renderButton = () => (
    <button
      ref={buttonRef}
      data-testid="filter-dropdown"
      onClick={() => setIsOpen(!isOpen)}
      onKeyDown={handleKeyDown}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      aria-labelledby={labelId}
      className={clsx(
        'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors w-full min-w-[80px] md:min-w-[120px] justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-primary text-foreground overflow-hidden',
        variant === 'default' ? 'bg-muted/30 hover:bg-muted/50' : 'hover:bg-muted/50'
      )}
    >
      <span className="flex items-center gap-2 min-w-0">
        <span
          className="flex items-center justify-center w-6 shrink-0 font-bold"
          aria-hidden="true"
        >
          {isMulti ? multiButtonIcon : isDefaultSelected ? defaultIcon : selectedItem?.icon}
        </span>
        <span className="truncate max-w-[120px]">
          {isMulti ? multiButtonLabel : isDefaultSelected ? defaultLabel : selectedItem?.label}
        </span>
      </span>
      <ChevronDown
        size={16}
        aria-hidden="true"
        className={clsx('transition-transform', isOpen && 'rotate-180')}
      />
    </button>
  )

  return (
    <div className={clsx('relative z-10', className)} ref={dropdownRef}>
      {noContainer ? (
        <>
          {label && (
            <span className="text-muted-foreground px-2" id={labelId}>
              {label}:
            </span>
          )}
          <div className="relative">
            {renderButton()}
            {isOpen && renderMenu()}
          </div>
        </>
      ) : (
        <div
          className={clsx(
            'border border-border rounded-lg shadow-lg p-2 inline-flex items-center gap-2',
            opaque ? 'bg-card' : 'bg-card/95 backdrop-blur-md'
          )}
        >
          {label && (
            <span className="text-muted-foreground px-2" id={labelId}>
              {label}:
            </span>
          )}
          <div className="relative">
            {renderButton()}
            {isOpen && renderMenu()}
          </div>
        </div>
      )}
    </div>
  )
}
