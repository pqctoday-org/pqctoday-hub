import React, { useState, useMemo } from 'react'
import {
  ArrowUpDown,
  Search,
  ExternalLink,
  Shield,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Calendar,
  Database,
  Download,
  Filter,
  Check,
  LockKeyhole,
  FileText,
  ChevronDown,
} from 'lucide-react'
import type { ComplianceRecord, ComplianceStatus } from './types'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import clsx from 'clsx'
import Papa from 'papaparse'

interface ComplianceTableProps {
  data: ComplianceRecord[]
  onRefresh?: () => void
  isRefreshing?: boolean
  lastUpdated?: Date | null
}

type SortDirection = 'asc' | 'desc'
type SortColumn = keyof ComplianceRecord

const PQC_ALGOS = ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'LMS', 'XMSS', 'HSS']

const StatusBadge = ({ status }: { status: ComplianceStatus }) => {
  const styles = {
    Active: 'bg-status-success text-status-success border-success/20',
    Historical: 'bg-muted text-muted-foreground border-border',
    Pending: 'bg-status-warning text-status-warning border-warning/20',
    'In Process': 'bg-status-info text-status-info border-blue-500/20',
    Revoked: 'bg-status-error text-status-error border-destructive/20',
  }

  return (
    <span
      className={clsx(
        'px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 w-fit',
        styles[status] || styles.Historical
      )}
    >
      {status === 'Active' && <ShieldCheck size={12} />}
      {status === 'Revoked' && <ShieldAlert size={12} />}
      {status === 'Pending' && <Shield size={12} />}
      {status}
    </span>
  )
}

const ComplianceRow = ({
  record,
  index,
  onEnrich,
}: {
  record: ComplianceRecord
  index: number
  onEnrich?: (record: ComplianceRecord) => void
}) => {
  const rowRef = React.useRef<HTMLTableRowElement>(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // If this record needs detailed PQC info (Pending), trigger enrich
          if (
            onEnrich &&
            (record.pqcCoverage === 'Pending Check...' || record.pqcCoverage === 'Potentially PQC')
          ) {
            onEnrich(record)
            observer.disconnect() // Only trigger once per view
          }
        }
      },
      { threshold: 0.1 } // 10% visible
    )

    if (rowRef.current) {
      observer.observe(rowRef.current)
    }

    return () => observer.disconnect()
  }, [record, onEnrich])

  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
      <td
        className="px-4 py-3 font-medium flex items-center gap-2 w-24 truncate"
        title={record.source}
      >
        <Database size={12} className="text-muted-foreground shrink-0" />
        <span className="truncate">{record.source}</span>
      </td>
      <td className="px-4 py-3 font-mono text-xs w-32 truncate" title={record.id}>
        {record.id.length > 20 ? record.id.substring(0, 20) + '...' : record.id}
      </td>
      <td className="px-4 py-3 text-muted-foreground font-mono text-xs whitespace-nowrap w-32">
        {record.date}
      </td>
      <td className="px-4 py-3 w-48">
        <div className="flex flex-col gap-0.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 w-fit">
            {record.type}
          </span>
          {record.certificationLevel && (
            <span
              className="text-[10px] text-muted-foreground truncate"
              title={record.certificationLevel}
            >
              {record.certificationLevel}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 font-medium text-foreground whitespace-normal break-words w-80">
        <div className="line-clamp-2" title={record.productName}>
          {record.productName}
        </div>
        <div className="text-xs text-muted-foreground truncate w-full">
          {record.productCategory}
        </div>
      </td>
      <td className="px-4 py-3 w-48">
        <div className="truncate" title={record.vendor}>
          {record.vendor}
        </div>
      </td>
      <td className="px-4 py-3 w-48">
        <div className="truncate" title={record.lab || ''}>
          {record.lab || '-'}
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={record.status} />
      </td>
      <td className="px-4 py-3 relative group">
        {record.pqcCoverage && record.pqcCoverage !== 'No PQC Mechanisms Detected' ? (
          <div className="flex items-center">
            {/* Icon Trigger */}
            <div
              className={clsx(
                'cursor-help p-1 rounded-full transition-colors',
                record.pqcCoverage === 'Pending Check...'
                  ? 'bg-warning/10 text-warning animate-pulse'
                  : 'bg-tertiary/10 text-tertiary hover:bg-tertiary/20'
              )}
            >
              {record.pqcCoverage === 'Pending Check...' ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <ShieldCheck size={18} />
              )}
            </div>

            {/* Custom Tooltip */}
            <div
              className={clsx(
                'absolute left-1/2 -translate-x-1/2 w-64 p-2 bg-popover border border-border rounded shadow-xl text-xs text-center z-[100] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-normal',
                index < 2 ? 'top-full mt-2' : 'bottom-full mb-2'
              )}
            >
              <div className="font-semibold text-tertiary mb-1">PQC Mechanisms</div>
              <div className="text-popover-foreground">
                {typeof record.pqcCoverage === 'boolean'
                  ? 'PQC Support Detected'
                  : record.pqcCoverage}
              </div>
              {/* Arrow */}
              <div
                className={clsx(
                  'absolute left-1/2 -translate-x-1/2 border-4 border-transparent',
                  index < 2 ? 'bottom-full border-b-popover' : 'top-full border-t-popover'
                )}
              ></div>
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </td>
      <td className="px-4 py-3 relative group">
        {record.classicalAlgorithms ? (
          <div className="flex items-center justify-center">
            <div className="cursor-help p-1 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
              <LockKeyhole size={14} />
            </div>
            {/* Custom Tooltip */}
            <div
              className={clsx(
                'absolute left-1/2 -translate-x-1/2 w-64 p-2 bg-popover border border-border rounded shadow-xl text-xs text-center z-[100] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-normal',
                index < 2 ? 'top-full mt-2' : 'bottom-full mb-2'
              )}
            >
              <div className="font-semibold text-muted-foreground mb-1">Classical Algorithms</div>
              <div className="text-popover-foreground">{record.classicalAlgorithms}</div>
              {/* Arrow */}
              <div
                className={clsx(
                  'absolute left-1/2 -translate-x-1/2 border-4 border-transparent',
                  index < 2 ? 'bottom-full border-b-popover' : 'top-full border-t-popover'
                )}
              ></div>
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </td>
      <td className="px-4 py-3">
        {record.certificationReportUrls || record.securityTargetUrls || record.additionalDocuments ? (
          <div className="relative group">
            <button
              className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
              title="View Documents"
            >
              <FileText size={16} />
              <ChevronDown size={12} />
            </button>
            <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-50 bg-card border border-border rounded-md shadow-lg min-w-[250px] py-1">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border">
                Available Documents
              </div>
              {record.certificationReportUrls && record.certificationReportUrls.length > 0 && (
                <div className="py-1">
                  <div className="px-3 py-1 text-xs font-medium text-foreground">Certification Reports</div>
                  {record.certificationReportUrls.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-3 py-1.5 text-xs text-primary hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={12} />
                        <span className="truncate">Report {idx + 1}</span>
                        <ExternalLink size={10} className="ml-auto" />
                      </div>
                    </a>
                  ))}
                </div>
              )}
              {record.securityTargetUrls && record.securityTargetUrls.length > 0 && (
                <div className="py-1">
                  <div className="px-3 py-1 text-xs font-medium text-foreground">Security Targets</div>
                  {record.securityTargetUrls.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-3 py-1.5 text-xs text-primary hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={12} />
                        <span className="truncate">Security Target {idx + 1}</span>
                        <ExternalLink size={10} className="ml-auto" />
                      </div>
                    </a>
                  ))}
                </div>
              )}
              {record.additionalDocuments && record.additionalDocuments.length > 0 && (
                <div className="py-1">
                  <div className="px-3 py-1 text-xs font-medium text-foreground">Other Documents</div>
                  {record.additionalDocuments.map((doc, idx) => (
                    <a
                      key={idx}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-3 py-1.5 text-xs text-primary hover:bg-accent transition-colors"
                      title={doc.name}
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={12} />
                        <span className="truncate max-w-[180px]">{doc.name}</span>
                        <ExternalLink size={10} className="ml-auto" />
                      </div>
                    </a>
                  ))}
                </div>
              )}
              <div className="border-t border-border mt-1 pt-1">
                <a
                  href={record.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ExternalLink size={12} />
                    <span>View Product Page</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        ) : (
          <a
            href={record.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors"
            title="View Official Record"
          >
            <ExternalLink size={16} />
          </a>
        )}
      </td>
    </tr>
  )
}

export const ComplianceTable: React.FC<
  ComplianceTableProps & { onEnrich?: (r: ComplianceRecord) => void }
> = ({ data, onRefresh, isRefreshing, lastUpdated, onEnrich }) => {
  const [filterText, setFilterText] = useState('')
  const [pqcFilters, setPqcFilters] = useState<string[]>([])
  const [typeFilters, setTypeFilters] = useState<string[]>([])
  const [categoryFilters, setCategoryFilters] = useState<string[]>([])
  const [sourceFilters, setSourceFilters] = useState<string[]>([])
  const [vendorFilters, setVendorFilters] = useState<string[]>([])

  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [showTypeMenu, setShowTypeMenu] = useState(false)
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  const [showSourceMenu, setShowSourceMenu] = useState(false)
  const [showVendorMenu, setShowVendorMenu] = useState(false)
  const [vendorSearch, setVendorSearch] = useState('')
  const [sortColumn, setSortColumn] = useState<SortColumn>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 50

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Reset to page 1 when filters change
  const [isFiltering, setIsFiltering] = useState(false)
  const [activeFilters, setActiveFilters] = useState({
    text: '',
    pqc: [] as string[],
    type: [] as string[],
    category: [] as string[],
    source: [] as string[],
    vendor: [] as string[],
    vendorSearch: '',
  })

  // Sync external state to internal activeFilters with a small delay to show loader
  React.useEffect(() => {
    setIsFiltering(true)
    const timer = setTimeout(() => {
      setActiveFilters({
        text: filterText,
        pqc: pqcFilters,
        type: typeFilters,
        category: categoryFilters,
        source: sourceFilters,
        vendor: vendorFilters,
        vendorSearch: vendorSearch,
      })
      setCurrentPage(1)
      setIsFiltering(false)
    }, 400) // 400ms delay for visual feedback
    return () => clearTimeout(timer)
  }, [
    filterText,
    pqcFilters,
    typeFilters,
    categoryFilters,
    sourceFilters,
    vendorFilters,
    vendorSearch,
  ])

  const handleTogglePqcFilter = (filter: string) => {
    setPqcFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    )
    setCurrentPage(1)
  }

  const handleToggleTypeFilter = (type: string) => {
    setTypeFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
    setCurrentPage(1)
  }

  const handleToggleCategoryFilter = (category: string) => {
    setCategoryFilters((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )
    setCurrentPage(1)
  }

  const handleToggleSourceFilter = (src: string) => {
    setSourceFilters((prev) =>
      prev.includes(src) ? prev.filter((s) => s !== src) : [...prev, src]
    )
    setCurrentPage(1)
  }

  const handleToggleVendorFilter = (vendor: string) => {
    setVendorFilters((prev) =>
      prev.includes(vendor) ? prev.filter((v) => v !== vendor) : [...prev, vendor]
    )
    setCurrentPage(1)
  }

  const uniqueTypes = useMemo(() => {
    const types = new Set(data.map((d) => d.type).filter(Boolean))
    return Array.from(types).sort()
  }, [data])

  const uniqueCategories = useMemo(() => {
    const cats = new Set(data.map((d) => d.productCategory).filter(Boolean))
    return Array.from(cats).sort()
  }, [data])

  const uniqueSources = useMemo(() => {
    const sources = new Set(data.map((d) => d.source).filter(Boolean))
    return Array.from(sources).sort()
  }, [data])

  const uniqueVendors = useMemo(() => {
    const vendors = new Set(data.map((d) => d.vendor).filter(Boolean))
    return Array.from(vendors).sort()
  }, [data])

  const filteredVendors = useMemo(() => {
    if (!vendorSearch) return uniqueVendors
    return uniqueVendors.filter((v) => v.toLowerCase().includes(vendorSearch.toLowerCase()))
  }, [uniqueVendors, vendorSearch])

  const filteredAndSortedData = useMemo(() => {
    // Filter
    let processed = data.filter((record) => {
      const searchStr = activeFilters.text.toLowerCase()
      const matchesText =
        record.productName.toLowerCase().includes(searchStr) ||
        record.vendor.toLowerCase().includes(searchStr) ||
        record.source.toLowerCase().includes(searchStr) ||
        record.type.toLowerCase().includes(searchStr) ||
        record.id.toLowerCase().includes(searchStr)

      // PQC Filter Logic
      const matchesPQC =
        activeFilters.pqc.length === 0 ||
        (typeof record.pqcCoverage === 'string' &&
          activeFilters.pqc.some((filter) => record.pqcCoverage.toString().includes(filter)))

      // Type Filter Logic
      const matchesType =
        activeFilters.type.length === 0 || activeFilters.type.includes(record.type)

      // Category Filter Logic
      const matchesCategory =
        activeFilters.category.length === 0 ||
        activeFilters.category.includes(record.productCategory)

      // Source Filter Logic
      const matchesSource =
        activeFilters.source.length === 0 || activeFilters.source.includes(record.source)

      // Vendor Filter Logic
      const matchesVendor =
        activeFilters.vendor.length === 0 ||
        activeFilters.vendor.some((v) => record.vendor.includes(v))

      const matchesVendorSearch =
        !activeFilters.vendorSearch ||
        record.vendor.toLowerCase().includes(activeFilters.vendorSearch.toLowerCase())

      return (
        matchesText &&
        matchesPQC &&
        matchesType &&
        matchesCategory &&
        matchesSource &&
        matchesVendor &&
        matchesVendorSearch
      )
    })

    // Sort
    processed.sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]

      if (aVal === bVal) return 0

      // Handle boolean for PQC coverage
      if (typeof aVal === 'boolean') {
        return sortDirection === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal)
      }

      // Handle Date sorting specifically
      if (sortColumn === 'date') {
        const dateA = new Date(String(aVal))
        const dateB = new Date(String(bVal))
        return sortDirection === 'asc'
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime()
      }

      const compareResult = String(aVal).localeCompare(String(bVal))
      return sortDirection === 'asc' ? compareResult : -compareResult
    })

    return processed
  }, [data, activeFilters, sortColumn, sortDirection])

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredAndSortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredAndSortedData, currentPage])

  const totalPages = Math.ceil(filteredAndSortedData.length / ITEMS_PER_PAGE)

  const handleExport = () => {
    if (filteredAndSortedData.length === 0) return

    const csv = Papa.unparse(filteredAndSortedData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `compliance_data_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      {/* Header: Search + Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products, vendors, types..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar size={14} />
              Last Updated: {lastUpdated.toLocaleDateString()} {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={filteredAndSortedData.length === 0}
            className="gap-2"
          >
            <Download size={14} />
            Export CSV
          </Button>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw size={14} className={clsx(isRefreshing && 'animate-spin')} />
              Refresh Data
            </Button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-md border border-border overflow-hidden bg-card/50 relative min-h-[400px]">
        {/* Loading Overlay */}
        {(isFiltering || isRefreshing) && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-[1px] flex items-center justify-center flex-col gap-3">
            <RefreshCw size={32} className="animate-spin text-primary" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-medium text-white">Filtering Records...</span>
              <span className="text-xs text-muted-foreground">
                {data.length.toLocaleString()} total verified
              </span>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left table-fixed">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
              <tr>
                {/* Source Column with Filter */}
                <th scope="col" className="px-4 py-3 w-24 relative">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-foreground" onClick={() => handleSort('source')}>
                      <span>Source</span>
                      <ArrowUpDown size={12} className={clsx(sortColumn === 'source' ? 'text-primary' : 'opacity-30')} />
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowSourceMenu(!showSourceMenu); }}
                        className={clsx("p-0.5 rounded hover:bg-muted", sourceFilters.length > 0 && "text-accent")}
                      >
                        <Filter size={12} />
                        {sourceFilters.length > 0 && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full text-[8px] flex items-center justify-center text-accent-foreground font-bold">
                            {sourceFilters.length}
                          </span>
                        )}
                      </button>
                      {showSourceMenu && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowSourceMenu(false)} />
                          <div className="absolute left-0 top-full mt-1 w-48 bg-popover border border-border rounded-md shadow-xl z-50 p-2 space-y-1">
                            <div className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">Select Source</div>
                            {uniqueSources.map((src) => (
                              <div
                                key={src}
                                onClick={() => handleToggleSourceFilter(src)}
                                className={clsx('flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer hover:bg-muted transition-colors', sourceFilters.includes(src) ? 'text-accent' : 'text-muted-foreground')}
                              >
                                <div className={clsx('w-3 h-3 rounded-[3px] border flex items-center justify-center', sourceFilters.includes(src) ? 'border-accent bg-accent' : 'border-border')}>
                                  {sourceFilters.includes(src) && <Check size={10} className="text-accent-foreground" />}
                                </div>
                                <span className="truncate">{src}</span>
                              </div>
                            ))}
                            {sourceFilters.length > 0 && (
                              <div onClick={() => setSourceFilters([])} className="text-xs text-center text-destructive hover:text-destructive/80 py-1 cursor-pointer border-t border-border mt-1 pt-2">
                                Clear
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </th>

                {/* Certification # Column */}
                <th scope="col" className="px-4 py-3 w-32 cursor-pointer hover:text-foreground" onClick={() => handleSort('id')}>
                  <div className="flex items-center gap-1">
                    <span>Certification #</span>
                    <ArrowUpDown size={12} className={clsx(sortColumn === 'id' ? 'text-primary' : 'opacity-30')} />
                  </div>
                </th>

                {/* Date Column */}
                <th scope="col" className="px-4 py-3 w-32 cursor-pointer hover:text-foreground" onClick={() => handleSort('date')}>
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <ArrowUpDown size={12} className={clsx(sortColumn === 'date' ? 'text-primary' : 'opacity-30')} />
                  </div>
                </th>

                {/* Type Column with Filter */}
                <th scope="col" className="px-4 py-3 w-48 relative">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-foreground" onClick={() => handleSort('type')}>
                      <span>Type</span>
                      <ArrowUpDown size={12} className={clsx(sortColumn === 'type' ? 'text-primary' : 'opacity-30')} />
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowTypeMenu(!showTypeMenu); }}
                        className={clsx("p-0.5 rounded hover:bg-muted", typeFilters.length > 0 && "text-primary")}
                      >
                        <Filter size={12} />
                        {typeFilters.length > 0 && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full text-[8px] flex items-center justify-center text-primary-foreground font-bold">
                            {typeFilters.length}
                          </span>
                        )}
                      </button>
                      {showTypeMenu && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowTypeMenu(false)} />
                          <div className="absolute left-0 top-full mt-1 w-64 bg-popover border border-border rounded-md shadow-xl z-50 p-2 space-y-1 max-h-80 overflow-y-auto">
                            <div className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">Select Types</div>
                            {uniqueTypes.map((type) => (
                              <div
                                key={type}
                                onClick={() => handleToggleTypeFilter(type)}
                                className={clsx('flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer hover:bg-muted transition-colors', typeFilters.includes(type) ? 'text-primary' : 'text-muted-foreground')}
                              >
                                <div className={clsx('w-3 h-3 rounded-[3px] border flex items-center justify-center', typeFilters.includes(type) ? 'border-primary bg-primary' : 'border-border')}>
                                  {typeFilters.includes(type) && <Check size={10} className="text-primary-foreground" />}
                                </div>
                                <span className="truncate">{type}</span>
                              </div>
                            ))}
                            {typeFilters.length > 0 && (
                              <div onClick={() => setTypeFilters([])} className="text-xs text-center text-destructive hover:text-destructive/80 py-1 cursor-pointer border-t border-border mt-1 pt-2">
                                Clear
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </th>

                {/* Product Name Column with Category Filter */}
                <th scope="col" className="px-4 py-3 w-80 relative">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-foreground" onClick={() => handleSort('productName')}>
                      <span>Product Name</span>
                      <ArrowUpDown size={12} className={clsx(sortColumn === 'productName' ? 'text-primary' : 'opacity-30')} />
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowCategoryMenu(!showCategoryMenu); }}
                        className={clsx("p-0.5 rounded hover:bg-muted", categoryFilters.length > 0 && "text-secondary")}
                        title="Filter by Product Category"
                      >
                        <Filter size={12} />
                        {categoryFilters.length > 0 && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full text-[8px] flex items-center justify-center text-secondary-foreground font-bold">
                            {categoryFilters.length}
                          </span>
                        )}
                      </button>
                      {showCategoryMenu && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowCategoryMenu(false)} />
                          <div className="absolute left-0 top-full mt-1 w-64 bg-popover border border-border rounded-md shadow-xl z-50 p-2 space-y-1 max-h-80 overflow-y-auto">
                            <div className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">Product Categories</div>
                            {uniqueCategories.map((cat) => (
                              <div
                                key={cat}
                                onClick={() => handleToggleCategoryFilter(cat)}
                                className={clsx('flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer hover:bg-muted transition-colors', categoryFilters.includes(cat) ? 'text-secondary' : 'text-muted-foreground')}
                              >
                                <div className={clsx('w-3 h-3 rounded-[3px] border flex items-center justify-center', categoryFilters.includes(cat) ? 'border-secondary bg-secondary' : 'border-border')}>
                                  {categoryFilters.includes(cat) && <Check size={10} className="text-secondary-foreground" />}
                                </div>
                                <span className="truncate">{cat}</span>
                              </div>
                            ))}
                            {categoryFilters.length > 0 && (
                              <div onClick={() => setCategoryFilters([])} className="text-xs text-center text-destructive hover:text-destructive/80 py-1 cursor-pointer border-t border-border mt-1 pt-2">
                                Clear
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </th>

                {/* Vendor Column with Filter */}
                <th scope="col" className="px-4 py-3 w-48 relative">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-foreground" onClick={() => handleSort('vendor')}>
                      <span>Vendor</span>
                      <ArrowUpDown size={12} className={clsx(sortColumn === 'vendor' ? 'text-primary' : 'opacity-30')} />
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowVendorMenu(!showVendorMenu); }}
                        className={clsx("p-0.5 rounded hover:bg-muted", vendorFilters.length > 0 && "text-warning")}
                      >
                        <Filter size={12} />
                        {vendorFilters.length > 0 && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-warning rounded-full text-[8px] flex items-center justify-center text-warning-foreground font-bold">
                            {vendorFilters.length}
                          </span>
                        )}
                      </button>
                      {showVendorMenu && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowVendorMenu(false)} />
                          <div className="absolute left-0 top-full mt-1 w-64 bg-popover border border-border rounded-md shadow-xl z-50 p-2 space-y-1 max-h-80 overflow-y-auto flex flex-col">
                            <div className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">Select Vendor</div>
                            <Input
                              placeholder="Search vendors..."
                              value={vendorSearch}
                              onChange={(e) => setVendorSearch(e.target.value)}
                              className="h-8 text-xs mb-1"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1 overflow-y-auto space-y-1">
                              {filteredVendors.map((v) => (
                                <div
                                  key={v}
                                  onClick={() => handleToggleVendorFilter(v)}
                                  className={clsx('flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer hover:bg-muted transition-colors', vendorFilters.includes(v) ? 'text-warning' : 'text-muted-foreground')}
                                >
                                  <div className={clsx('w-3 h-3 rounded-[3px] border flex items-center justify-center', vendorFilters.includes(v) ? 'border-warning bg-warning' : 'border-border')}>
                                    {vendorFilters.includes(v) && <Check size={10} className="text-warning-foreground" />}
                                  </div>
                                  <span className="truncate">{v}</span>
                                </div>
                              ))}
                              {filteredVendors.length === 0 && (
                                <div className="px-2 py-4 text-center text-xs text-muted-foreground">No vendors found.</div>
                              )}
                            </div>
                            {vendorFilters.length > 0 && (
                              <div onClick={() => { setVendorFilters([]); setVendorSearch(''); }} className="text-xs text-center text-destructive hover:text-destructive/80 py-1 cursor-pointer border-t border-border mt-1 pt-2">
                                Clear
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </th>

                {/* Lab Column */}
                <th scope="col" className="px-4 py-3 w-48 cursor-pointer hover:text-foreground" onClick={() => handleSort('vendor')}>
                  <div className="flex items-center gap-1">
                    <span>Lab</span>
                    <ArrowUpDown size={12} className={clsx(sortColumn === 'vendor' ? 'text-primary' : 'opacity-30')} />
                  </div>
                </th>

                {/* Status Column */}
                <th scope="col" className="px-4 py-3 w-32 cursor-pointer hover:text-foreground" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    <ArrowUpDown size={12} className={clsx(sortColumn === 'status' ? 'text-primary' : 'opacity-30')} />
                  </div>
                </th>

                {/* PQC Column with Filter */}
                <th scope="col" className="px-4 py-3 w-20 relative">
                  <div className="flex flex-col items-center gap-0.5">
                    <span>PQC</span>
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowFilterMenu(!showFilterMenu); }}
                        className={clsx("p-0.5 rounded hover:bg-muted", pqcFilters.length > 0 && "text-tertiary")}
                      >
                        <Filter size={12} />
                        {pqcFilters.length > 0 && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-tertiary rounded-full text-[8px] flex items-center justify-center text-tertiary-foreground font-bold">
                            {pqcFilters.length}
                          </span>
                        )}
                      </button>
                      {showFilterMenu && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowFilterMenu(false)} />
                          <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-md shadow-xl z-50 p-2 space-y-1">
                            <div className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">PQC Algorithms</div>
                            {PQC_ALGOS.map((algo) => (
                              <div
                                key={algo}
                                onClick={() => handleTogglePqcFilter(algo)}
                                className={clsx('flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer hover:bg-muted transition-colors', pqcFilters.includes(algo) ? 'text-tertiary' : 'text-muted-foreground')}
                              >
                                <div className={clsx('w-3 h-3 rounded-[3px] border flex items-center justify-center', pqcFilters.includes(algo) ? 'border-tertiary bg-tertiary' : 'border-border')}>
                                  {pqcFilters.includes(algo) && <Check size={10} className="text-tertiary-foreground" />}
                                </div>
                                <span className="truncate">{algo}</span>
                              </div>
                            ))}
                            {pqcFilters.length > 0 && (
                              <div onClick={() => setPqcFilters([])} className="text-xs text-center text-destructive hover:text-destructive/80 py-1 cursor-pointer border-t border-border mt-1 pt-2">
                                Clear
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </th>

                {/* CC Column */}
                <th scope="col" className="px-4 py-3 w-20">
                  <span>CC</span>
                </th>

                {/* Link Column */}
                <th scope="col" className="px-4 py-3 w-20">
                  <span>Link</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((record, index) => (
                <ComplianceRow key={record.id} record={record} index={index} onEnrich={onEnrich} />
              ))}
              {filteredAndSortedData.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">
                    No compliance records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Pagination Controls */}
      {
        filteredAndSortedData.length > 0 && (
          <div className="flex items-center justify-between px-2">
            <div className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedData.length)} of{' '}
              {filteredAndSortedData.length} records
              {filteredAndSortedData.length !== data.length && (
                <span className="ml-1 text-primary-foreground/50">(filtered from {data.length})</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="bg-card/50 border-input"
              >
                Previous
              </Button>
              <div className="flex items-center gap-1 text-xs font-mono bg-card/50 px-3 rounded border border-border">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="bg-card/50 border-input"
              >
                Next
              </Button>
            </div>
          </div>
        )
      }
    </div >
  )
}
