import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  ExternalLink,
  Calendar,
  FileText,
  Database,
  Shield,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react'
import type { ComplianceRecord, ComplianceStatus } from './types'
import clsx from 'clsx'

interface ComplianceDetailPopoverProps {
  isOpen: boolean
  onClose: () => void
  record: ComplianceRecord | null
}

const StatusBadge = ({ status }: { status: ComplianceStatus }) => {
  const styles = {
    Active: 'bg-status-success text-status-success border-status-success/50',
    Historical: 'bg-muted text-muted-foreground border-border',
    Pending: 'bg-status-warning text-status-warning border-status-warning/50',
    'In Process': 'bg-status-info text-status-info border-status-info/50',
    Revoked: 'bg-status-error text-status-error border-status-error/50',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border gap-1',
        styles[status] || styles.Historical
      )}
    >
      {status === 'Active' && <ShieldCheck size={10} />}
      {status === 'Revoked' && <ShieldAlert size={10} />}
      {status === 'Pending' && <Shield size={10} />}
      {status}
    </span>
  )
}

export const ComplianceDetailPopover = ({
  isOpen,
  onClose,
  record,
}: ComplianceDetailPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !record) return null

  // Center the popover
  const style: React.CSSProperties = {
    zIndex: 9999, // Ensure it's on top of everything
  }

  const content = (
    <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm" aria-hidden="true">
      <div
        ref={popoverRef}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] max-w-[800px] max-h-[85vh] border border-border rounded-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col bg-popover text-popover-foreground shadow-2xl"
        style={style}
        role="dialog"
        aria-modal="true"
        aria-labelledby="popover-title"
      >
        {/* Header */}
        <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-start gap-4">
          <div className="space-y-1 w-full">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <StatusBadge status={record.status} />
                <span className="text-xs text-muted-foreground font-mono">{record.id}</span>
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ×
              </button>
            </div>
            <h3 id="popover-title" className="text-lg font-bold text-foreground leading-tight pr-8">
              {record.productName}
            </h3>
            <div className="text-xs text-muted-foreground">{record.vendor}</div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 w-full">
            {/* Type */}
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Type
              </h4>
              <p className="text-sm text-foreground">{record.type}</p>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Category
              </h4>
              <p className="text-sm text-foreground">{record.productCategory}</p>
            </div>

            {/* Lab */}
            {record.lab && (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Evaluation Lab
                </h4>
                <p className="text-sm text-foreground">{record.lab}</p>
              </div>
            )}

            {/* Cert Level */}
            {record.certificationLevel && (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Certification Level
                </h4>
                <p className="text-sm text-foreground">{record.certificationLevel}</p>
              </div>
            )}

            {/* Date */}
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Certification Date
              </h4>
              <div className="flex items-center gap-1.5 text-foreground text-sm">
                <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                <span>{record.date}</span>
              </div>
            </div>

            {/* Source */}
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Source
              </h4>
              <div className="flex items-center gap-1.5 text-foreground text-sm">
                <Database className="w-3 h-3 text-muted-foreground shrink-0" />
                <span>{record.source}</span>
              </div>
            </div>
          </div>

          {/* PQC Section */}
          {record.pqcCoverage && record.pqcCoverage !== 'No PQC Mechanisms Detected' && (
            <div className="space-y-2 p-3 bg-tertiary/5 rounded border border-tertiary/10">
              <h4 className="text-xs font-semibold text-tertiary uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck size={12} />
                PQC Mechanisms Detected
              </h4>
              <p className="text-sm text-foreground">
                {typeof record.pqcCoverage === 'boolean'
                  ? 'Detailed analysis confirmed PQC support.'
                  : record.pqcCoverage}
              </p>
            </div>
          )}

          {/* Classical Algorithms Section */}
          {record.classicalAlgorithms && (
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Classical Algorithms
              </h4>
              <p className="text-sm text-muted-foreground">{record.classicalAlgorithms}</p>
            </div>
          )}

          {/* Documents Section */}
          {(record.certificationReportUrls ||
            record.securityTargetUrls ||
            record.additionalDocuments) && (
            <div className="space-y-3 pt-2 border-t border-border">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Documentation
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {record.certificationReportUrls?.map((url, idx) => (
                  <a
                    key={`report-${idx}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded bg-muted/50 hover:bg-muted transition-colors border border-border text-xs text-primary"
                  >
                    <FileText size={14} className="shrink-0" />
                    <span className="truncate flex-1">Certification Report {idx + 1}</span>
                    <ExternalLink size={10} className="shrink-0 opacity-50" />
                  </a>
                ))}
                {record.securityTargetUrls?.map((url, idx) => (
                  <a
                    key={`target-${idx}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded bg-muted/50 hover:bg-muted transition-colors border border-border text-xs text-primary"
                  >
                    <FileText size={14} className="shrink-0" />
                    <span className="truncate flex-1">Security Target {idx + 1}</span>
                    <ExternalLink size={10} className="shrink-0 opacity-50" />
                  </a>
                ))}
                {record.additionalDocuments?.map((doc, idx) => (
                  <a
                    key={`doc-${idx}`}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded bg-muted/50 hover:bg-muted transition-colors border border-border text-xs text-primary"
                  >
                    <FileText size={14} className="shrink-0" />
                    <span className="truncate flex-1">{doc.name}</span>
                    <ExternalLink size={10} className="shrink-0 opacity-50" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Footer: Official Source */}
          {record.link && (
            <div className="pt-2 border-t border-border mt-2">
              <a
                href={record.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
              >
                <ExternalLink size={14} />
                {record.link.includes('?expand#')
                  ? 'View Product Details'
                  : 'View Official Record Source'}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
