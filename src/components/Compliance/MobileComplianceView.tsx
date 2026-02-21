import React, { useState, useMemo } from 'react'
import { Search, ShieldCheck, Database } from 'lucide-react'
import { Input } from '../ui/input'
import type { ComplianceRecord } from './types'
import { ComplianceDetailPopover } from './ComplianceDetailPopover'
import clsx from 'clsx'

interface MobileComplianceViewProps {
  data: ComplianceRecord[]
}

const MOBILE_PAGE_SIZE = 50

export const MobileComplianceView: React.FC<MobileComplianceViewProps> = ({ data }) => {
  const [filterText, setFilterText] = useState('')
  const [pqcOnly, setPqcOnly] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<ComplianceRecord | null>(null)

  const filteredData = useMemo(() => {
    let result = data
    if (filterText) {
      const q = filterText.toLowerCase()
      result = result.filter(
        (r) =>
          r.productName.toLowerCase().includes(q) ||
          r.vendor.toLowerCase().includes(q) ||
          r.source.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q)
      )
    }
    if (pqcOnly) {
      result = result.filter(
        (r) =>
          r.pqcCoverage &&
          r.pqcCoverage !== 'No PQC Mechanisms Detected' &&
          r.pqcCoverage !== 'Pending Check...'
      )
    }
    return result.slice(0, MOBILE_PAGE_SIZE)
  }, [data, filterText, pqcOnly])

  return (
    <div className="space-y-4">
      {/* Search + filter chips */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products, vendors..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPqcOnly((v) => !v)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
              pqcOnly
                ? 'border-tertiary/30 bg-tertiary/10 text-foreground'
                : 'border-border bg-card text-muted-foreground'
            )}
          >
            <ShieldCheck size={12} />
            PQC Only
          </button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {filteredData.length === MOBILE_PAGE_SIZE && data.length > MOBILE_PAGE_SIZE
          ? `Showing first ${MOBILE_PAGE_SIZE} of ${data.length} — refine search to see more`
          : `${filteredData.length} of ${data.length} records`}
      </p>

      {/* Cards */}
      <div className="space-y-3">
        {filteredData.map((record) => (
          <button
            key={`${record.id}-${record.source}`}
            type="button"
            onClick={() => setSelectedRecord(record)}
            className="w-full text-left glass-panel p-4 hover:border-primary/30 transition-colors active:scale-[0.99]"
          >
            {/* Header: source + status + PQC indicator */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                  <Database size={10} className="shrink-0" />
                  {record.source}
                </span>
                <span
                  className={clsx(
                    'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border',
                    record.status === 'Active'
                      ? 'bg-status-success/10 text-status-success border-status-success/30'
                      : record.status === 'Revoked'
                        ? 'bg-status-error/10 text-status-error border-status-error/30'
                        : record.status === 'Pending' || record.status === 'In Process'
                          ? 'bg-status-warning/10 text-status-warning border-status-warning/30'
                          : 'bg-muted text-muted-foreground border-border'
                  )}
                >
                  {record.status}
                </span>
              </div>
              {record.pqcCoverage &&
                record.pqcCoverage !== 'No PQC Mechanisms Detected' &&
                record.pqcCoverage !== 'Pending Check...' && (
                  <ShieldCheck size={16} className="text-tertiary shrink-0 mt-0.5" />
                )}
            </div>

            {/* Product name */}
            <p className="text-sm font-semibold text-foreground leading-snug mb-1 line-clamp-2">
              {record.productName}
            </p>

            {/* Vendor */}
            <p className="text-xs text-muted-foreground truncate">{record.vendor}</p>
            {record.productCategory && (
              <p className="text-xs text-muted-foreground/60 truncate">{record.productCategory}</p>
            )}

            {/* Footer: date + cert # */}
            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border">
              <span className="text-xs font-mono text-muted-foreground">{record.date}</span>
              <span className="text-xs font-mono text-muted-foreground/60 truncate">
                #{record.id.length > 18 ? record.id.substring(0, 18) + '…' : record.id}
              </span>
            </div>
          </button>
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="py-12 text-center text-muted-foreground text-sm">
          No records match your search.
        </div>
      )}

      <ComplianceDetailPopover
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
      />
    </div>
  )
}
