// SPDX-License-Identifier: GPL-3.0-only
/**
 * DataTable — unified sortable table with optional pagination, row expansion,
 * and tree hierarchy support.
 *
 * Designed to consolidate ComplianceTable, SoftwareTable, and LibraryTreeTable
 * into a single composable primitive.
 */
import { useState, useMemo, useCallback } from 'react'
import { ChevronUp, ChevronDown, ChevronRight, ChevronDownIcon } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from './button'

// ── Column definition ────────────────────────────────────────────────────────

export interface ColumnDef<T> {
  /** Unique column identifier — used as sort key when `sortable` is true. */
  id: string
  /** Header content (string or JSX). */
  header: React.ReactNode
  /** Key on `T` to read the cell value (used for default sorting + default cell render). */
  accessorKey?: keyof T
  /** Custom cell renderer — overrides default text display. */
  cell?: (row: T, index: number) => React.ReactNode
  /** Enable sorting for this column (default: false). */
  sortable?: boolean
  /** CSS class applied to `<td>`. */
  className?: string
  /** CSS class applied to `<th>`. */
  headerClassName?: string
  /** Hide column on mobile (`hidden md:table-cell`). */
  hiddenOnMobile?: boolean
}

// ── Sort types ───────────────────────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  key: string
  direction: SortDirection
}

// ── Props ────────────────────────────────────────────────────────────────────

export interface DataTableProps<T> {
  /** Data rows. */
  data: T[]
  /** Column definitions. */
  columns: ColumnDef<T>[]
  /** Unique key for each row. */
  getRowKey: (row: T) => string

  // ── Sorting ──
  /** Default sort column + direction. */
  defaultSort?: SortConfig
  /** Custom sort comparator. Receives raw values from `accessorKey`. */
  sortFn?: (a: T, b: T, key: string, direction: SortDirection) => number

  // ── Pagination ──
  /** Items per page. Omit for no pagination. */
  pageSize?: number

  // ── Single-level row expansion ──
  /** Render expanded row content below the main row. */
  renderExpanded?: (row: T) => React.ReactNode

  // ── Tree hierarchy ──
  /** Return child items for tree rendering. Omit for flat tables. */
  getChildren?: (row: T) => T[] | undefined
  /** Expand all tree nodes on mount. */
  defaultExpandAll?: boolean

  // ── Row interaction ──
  /** Click handler for the entire row. */
  onRowClick?: (row: T) => void
  /** Dynamic class name per row. */
  rowClassName?: (row: T) => string
  /** Extra columns rendered before data columns (e.g., checkboxes, expand buttons). */
  leadingColumns?: ColumnDef<T>[]

  // ── Accessibility ──
  ariaLabel?: string
  /** Table `id` for aria-controls references. */
  id?: string

  // ── Sticky header ──
  stickyHeader?: boolean

  // ── Empty state ──
  emptyMessage?: string
}

// ── Default sort comparator ──────────────────────────────────────────────────

const defaultSortFn = <T,>(a: T, b: T, key: string, direction: SortDirection): number => {
  const aVal = (a as Record<string, unknown>)[key]
  const bVal = (b as Record<string, unknown>)[key]
  const aStr = Array.isArray(aVal) ? aVal.join(', ') : String(aVal ?? '')
  const bStr = Array.isArray(bVal) ? bVal.join(', ') : String(bVal ?? '')
  const cmp = aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: 'base' })
  return direction === 'asc' ? cmp : -cmp
}

// ── Component ────────────────────────────────────────────────────────────────

export function DataTable<T>({
  data,
  columns,
  getRowKey,
  defaultSort,
  sortFn,
  pageSize,
  renderExpanded,
  getChildren,
  defaultExpandAll = false,
  onRowClick,
  rowClassName,
  leadingColumns,
  ariaLabel = 'Data table',
  id,
  stickyHeader = false,
  emptyMessage = 'No data to display.',
}: DataTableProps<T>) {
  // ── Sort state ──
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(defaultSort ?? null)

  const handleSort = useCallback((colId: string) => {
    setSortConfig((prev) => {
      if (prev?.key === colId) {
        return { key: colId, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key: colId, direction: 'asc' }
    })
    setCurrentPage(1)
  }, [])

  // ── Pagination state ──
  const [currentPage, setCurrentPage] = useState(1)

  // ── Expansion state (single-level + tree) ──
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    if (!defaultExpandAll || !getChildren) return new Set()
    const ids = new Set<string>()
    const walk = (items: T[]) => {
      for (const item of items) {
        const children = getChildren(item)
        if (children?.length) {
          ids.add(getRowKey(item))
          walk(children)
        }
      }
    }
    walk(data)
    return ids
  })

  const toggleExpanded = useCallback((key: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  // ── Sorted data ──
  const comparator = sortFn ?? defaultSortFn
  const sortedData = useMemo(() => {
    if (!sortConfig) return data
    const sorted = [...data]
    sorted.sort((a, b) => comparator(a, b, sortConfig.key, sortConfig.direction))
    return sorted
  }, [data, sortConfig, comparator])

  // ── Paginated data ──
  const totalPages = pageSize ? Math.max(1, Math.ceil(sortedData.length / pageSize)) : 1
  const paginatedData = useMemo(() => {
    if (!pageSize) return sortedData
    const start = (currentPage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, currentPage, pageSize])

  // ── All columns (leading + data) ──
  const allColumns = useMemo(
    () => [...(leadingColumns ?? []), ...columns],
    [leadingColumns, columns]
  )

  // ── Render sort icon ──
  const renderSortIcon = (colId: string) => {
    if (sortConfig?.key !== colId) return null
    return sortConfig.direction === 'asc' ? (
      <ChevronUp size={14} className="inline ml-1" />
    ) : (
      <ChevronDown size={14} className="inline ml-1" />
    )
  }

  // ── Render flat rows ──
  const renderFlatRows = () =>
    paginatedData.map((row, idx) => {
      const key = getRowKey(row)
      const isExpanded = renderExpanded && expandedIds.has(key)
      return (
        <tbody key={key}>
          <tr
            className={cn(
              'border-b border-border hover:bg-muted/50 transition-colors',
              onRowClick && 'cursor-pointer',
              rowClassName?.(row)
            )}
            onClick={() => onRowClick?.(row)}
          >
            {allColumns.map((col) => (
              <td
                key={col.id}
                className={cn(
                  'px-4 py-3 text-sm',
                  col.className,
                  col.hiddenOnMobile && 'hidden md:table-cell'
                )}
              >
                {col.cell
                  ? col.cell(row, idx)
                  : col.accessorKey
                    ? String((row as Record<string, unknown>)[col.accessorKey as string] ?? '')
                    : null}
              </td>
            ))}
          </tr>
          {isExpanded && renderExpanded && (
            <tr className="bg-muted/10">
              <td colSpan={allColumns.length} className="px-4 py-3">
                {renderExpanded(row)}
              </td>
            </tr>
          )}
        </tbody>
      )
    })

  // ── Render tree rows (recursive) ──
  const renderTreeRows = (
    items: T[],
    level = 0,
    visited = new Set<string>()
  ): React.ReactNode[] => {
    if (!getChildren) return []
    const rows: React.ReactNode[] = []

    const sorted = sortConfig
      ? [...items].sort((a, b) => comparator(a, b, sortConfig.key, sortConfig.direction))
      : items

    for (const item of sorted) {
      const key = getRowKey(item)
      if (visited.has(key)) continue
      const newVisited = new Set(visited)
      newVisited.add(key)

      const children = getChildren(item)
      const hasChildren = !!children?.length
      const isExpanded = expandedIds.has(key)

      rows.push(
        <tr
          key={`${key}-${level}`}
          className={cn(
            'border-b border-border hover:bg-muted/50 transition-colors',
            onRowClick && 'cursor-pointer',
            rowClassName?.(item)
          )}
          onClick={() => onRowClick?.(item)}
        >
          {allColumns.map((col, colIdx) => (
            <td
              key={col.id}
              className={cn(
                'px-4 py-3 text-sm',
                col.className,
                col.hiddenOnMobile && 'hidden md:table-cell'
              )}
              style={colIdx === 0 ? { paddingLeft: `${level * 20 + 16}px` } : undefined}
            >
              {colIdx === 0 && (
                <>
                  {hasChildren ? (
                    // eslint-disable-next-line no-restricted-syntax
                    <button
                      type="button"
                      className="inline-flex items-center justify-center w-6 h-6 mr-1 rounded hover:bg-muted/50"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleExpanded(key)
                      }}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronDownIcon size={14} /> : <ChevronRight size={14} />}
                    </button>
                  ) : (
                    <span className="inline-block w-6 mr-1" />
                  )}
                </>
              )}
              {col.cell
                ? col.cell(item, level)
                : col.accessorKey
                  ? String((item as Record<string, unknown>)[col.accessorKey as string] ?? '')
                  : null}
            </td>
          ))}
        </tr>
      )

      if (hasChildren && isExpanded) {
        rows.push(...renderTreeRows(children!, level + 1, newVisited))
      }
    }

    return rows
  }

  // ── Expand/collapse all (tree mode) ──
  const expandAll = useCallback(() => {
    if (!getChildren) return
    const ids = new Set<string>()
    const walk = (items: T[]) => {
      for (const item of items) {
        const children = getChildren(item)
        if (children?.length) {
          ids.add(getRowKey(item))
          walk(children)
        }
      }
    }
    walk(data)
    setExpandedIds(ids)
  }, [data, getChildren, getRowKey])

  const collapseAll = useCallback(() => setExpandedIds(new Set()), [])

  // ── Render ─────────────────────────────────────────────────────────────────

  const isTree = !!getChildren
  const isEmpty = data.length === 0

  return (
    <div className="space-y-2">
      {/* Tree expand/collapse controls */}
      {isTree && !isEmpty && (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={expandAll} aria-controls={id}>
            Expand All
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll} aria-controls={id}>
            Collapse All
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table id={id} className="w-full text-sm" role="table" aria-label={ariaLabel}>
          <thead>
            <tr
              className={cn(
                'border-b border-border bg-muted/50',
                stickyHeader && 'sticky top-0 z-10 bg-muted'
              )}
            >
              {allColumns.map((col) => {
                const isSorted = sortConfig?.key === col.id
                return (
                  <th
                    key={col.id}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider',
                      col.sortable && 'cursor-pointer select-none hover:text-foreground',
                      col.headerClassName,
                      col.hiddenOnMobile && 'hidden md:table-cell'
                    )}
                    onClick={col.sortable ? () => handleSort(col.id) : undefined}
                    aria-sort={
                      isSorted
                        ? sortConfig!.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    {col.header}
                    {col.sortable && renderSortIcon(col.id)}
                  </th>
                )
              })}
            </tr>
          </thead>

          {isEmpty ? (
            <tbody>
              <tr>
                <td
                  colSpan={allColumns.length}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            </tbody>
          ) : isTree ? (
            <tbody>{renderTreeRows(paginatedData)}</tbody>
          ) : (
            renderFlatRows()
          )}
        </table>
      </div>

      {/* Pagination */}
      {pageSize && totalPages > 1 && (
        <div className="flex items-center justify-between px-2 text-sm text-muted-foreground">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Expansion toggle helper ──────────────────────────────────────────────────

/** Pre-built leading column for single-level row expansion. */
export function makeExpandColumn<T>(
  getRowKey: (row: T) => string,
  expandedIds: Set<string>,
  onToggle: (key: string) => void
): ColumnDef<T> {
  return {
    id: '__expand',
    header: '',
    className: 'w-10',
    cell: (row) => {
      const key = getRowKey(row)
      const isExpanded = expandedIds.has(key)
      return (
        // eslint-disable-next-line no-restricted-syntax
        <button
          type="button"
          className="p-1 rounded hover:bg-muted/50"
          onClick={(e) => {
            e.stopPropagation()
            onToggle(key)
          }}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
        >
          {isExpanded ? <ChevronDownIcon size={14} /> : <ChevronRight size={14} />}
        </button>
      )
    },
  }
}
