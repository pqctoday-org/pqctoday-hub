// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import FocusLock from 'react-focus-lock'
import type { SoftwareItem } from '../../types/MigrateTypes'
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
  EyeOff,
  Award,
  Shield,
  CheckSquare,
  Square,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  ShieldCheck,
  CheckCircle,
  BadgeCheck,
  AlertCircle,
  XCircle,
  Ban,
  MinusCircle,
  RefreshCw,
  Clock,
  X,
} from 'lucide-react'
import { LAYERS } from './InfrastructureStack'
import { certsByProduct } from '../../data/certificationXrefData'
import { cpeByProduct } from '../../data/cpeXrefData'
import { purlByProduct } from '../../data/purlXrefData'
import { vendorMap } from '../../data/migrateData'
import { getProductExtraction } from '../../data/productExtractionData'
import { AskAssistantButton } from '../ui/AskAssistantButton'
import { UpdateProductButton } from '../ui/UpdateProductButton'
import { buildProductUpdateUrl } from '@/utils/endorsement'
import { ProductExtractionModal } from './ProductExtractionModal'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { CertBadges, EvidenceWarnings, renderFipsStatus, renderPqcSupport } from './migrateHelpers'
import { TrustScoreBadge } from '@/components/ui/TrustScoreBadge'

function ValidationResultBadge({ result }: { result: SoftwareItem['validationResult'] }) {
  if (!result) return null
  const config: Record<
    NonNullable<SoftwareItem['validationResult']>,
    { label: string; icon: React.ReactNode; cls: string }
  > = {
    VALIDATED: {
      label: 'Validated',
      icon: <CheckCircle size={11} />,
      cls: 'text-status-success bg-status-success/10 border-status-success/20',
    },
    FIPS_VERIFIED: {
      label: 'FIPS Verified',
      icon: <BadgeCheck size={11} />,
      cls: 'text-status-success bg-status-success/10 border-status-success/20',
    },
    VALIDATED_NO_PQC: {
      label: 'No PQC',
      icon: <MinusCircle size={11} />,
      cls: 'text-muted-foreground bg-muted border-border',
    },
    CORRECTED: {
      label: 'Corrected',
      icon: <RefreshCw size={11} />,
      cls: 'text-status-warning bg-status-warning/10 border-status-warning/20',
    },
    PARTIALLY_VALIDATED: {
      label: 'Partial',
      icon: <AlertCircle size={11} />,
      cls: 'text-status-warning bg-status-warning/10 border-status-warning/20',
    },
    NEEDS_REVIEW: {
      label: 'Needs Review',
      icon: <Clock size={11} />,
      cls: 'text-status-warning bg-status-warning/10 border-status-warning/20',
    },
    NOT_VALIDATED: {
      label: 'Not Validated',
      icon: <Ban size={11} />,
      cls: 'text-status-error bg-status-error/10 border-status-error/20',
    },
    FIPS_ISSUE: {
      label: 'FIPS Issue',
      icon: <XCircle size={11} />,
      cls: 'text-status-error bg-status-error/10 border-status-error/20',
    },
  }
  const { label, icon, cls } = config[result] ?? config['NEEDS_REVIEW']
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${cls}`}
    >
      {icon}
      {label}
    </span>
  )
}

interface ProofModalProps {
  isOpen: boolean
  onClose: () => void
  item: SoftwareItem
}

function ProofModal({ isOpen, onClose, item }: ProofModalProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', onKey)
      document.addEventListener('mousedown', onOutside)
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const content = (
    <FocusLock returnFocus>
      <div
        className="fixed inset-0 z-[9998] bg-black/60 flex items-center justify-center p-4"
        aria-hidden="true"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="proof-modal-title"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-[95vw] sm:w-[80vw] md:w-[520px] max-h-[85vh] bg-popover border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-4 border-b border-border bg-muted/20 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <ShieldCheck size={14} className="text-primary shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Validation Proof
              </span>
              <ValidationResultBadge result={item.validationResult} />
            </div>
            <h3
              id="proof-modal-title"
              className="text-sm font-semibold text-foreground leading-snug"
            >
              {item.softwareName}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close proof"
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors shrink-0"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {item.proofRelevantInfo && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1.5">
                Summary
              </p>
              <p className="text-sm text-foreground leading-relaxed">{item.proofRelevantInfo}</p>
            </div>
          )}
          {item.proofPublicationDate && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1">
                Publication Date
              </p>
              <p className="text-sm text-foreground">{item.proofPublicationDate}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {item.proofUrl && (
          <div className="p-4 border-t border-border shrink-0">
            <a
              href={item.proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              <ExternalLink size={14} />
              Open Source Document
            </a>
          </div>
        )}
      </div>
    </FocusLock>
  )

  return createPortal(content, document.body)
}

interface SoftwareTableProps {
  data: SoftwareItem[]
  defaultSort?: { key: SortKey; direction: SortDirection }
  hiddenProducts?: Set<string>
  onHideProduct?: (key: string) => void
  /** Keys of products the user has marked as "My Products" */
  selectedProducts?: Set<string>
  /** Toggle a product's "My Products" selection */
  onToggleProduct?: (key: string) => void
  /** Keys of products added to the comparison panel */
  compareProducts?: Set<string>
  /** Toggle a product's compare selection */
  onToggleCompare?: (key: string) => void
  /** True when 3 compare slots are full */
  maxCompareReached?: boolean
  /** Controlled expanded row IDs — when provided, parent owns the state */
  expandedIds?: Set<string>
  /** Callback when a row is toggled — required when expandedIds is controlled */
  onToggleExpand?: (id: string) => void
}

type SortDirection = 'asc' | 'desc' | null
type SortKey = keyof SoftwareItem

export const SoftwareTable: React.FC<SoftwareTableProps> = ({
  data,
  defaultSort,
  hiddenProducts,
  onHideProduct,
  selectedProducts,
  onToggleProduct,
  compareProducts,
  onToggleCompare,
  maxCompareReached,
  expandedIds: controlledExpandedIds,
  onToggleExpand,
}) => {
  const { migrateBookmarks, toggleMigrateBookmark } = useBookmarkStore()
  const migrateBookmarkSet = useMemo(() => new Set(migrateBookmarks), [migrateBookmarks])
  const [localExpandedIds, setLocalExpandedIds] = useState<Set<string>>(new Set())
  const expandedIds = controlledExpandedIds ?? localExpandedIds
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>(
    defaultSort || { key: 'softwareName', direction: 'asc' }
  )
  const [extractionModal, setExtractionModal] = useState<{ softwareName: string } | null>(null)
  const [proofModal, setProofModal] = useState<SoftwareItem | null>(null)

  const rowKey = (item: SoftwareItem) => `${item.softwareName}::${item.categoryId}`

  const toggleExpand = (id: string) => {
    if (onToggleExpand) {
      onToggleExpand(id)
      return
    }
    const newExpanded = new Set(localExpandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setLocalExpandedIds(newExpanded)
  }

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedData = useMemo(() => {
    if (!sortConfig.direction) return data

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key] || ''
      const bValue = b[sortConfig.key] || ''

      const aString = String(aValue).toLowerCase()
      const bString = String(bValue).toLowerCase()

      return sortConfig.direction === 'asc'
        ? aString.localeCompare(bString)
        : bString.localeCompare(aString)
    })
  }, [data, sortConfig])

  const headers: { key: SortKey; label: string; mobileHidden?: boolean }[] = [
    { key: 'softwareName', label: 'Product' },
    { key: 'infrastructureLayer', label: 'Layer' },
    { key: 'categoryName', label: 'Category', mobileHidden: true },
    { key: 'pqcSupport', label: 'PQC Support' },
    { key: 'license', label: 'License', mobileHidden: true },
    { key: 'fipsValidated', label: 'FIPS' },
  ]

  const visibleData = useMemo(
    () =>
      hiddenProducts ? sortedData.filter((item) => !hiddenProducts.has(rowKey(item))) : sortedData,
    [sortedData, hiddenProducts]
  )

  const hasSelection = !!(selectedProducts && onToggleProduct)
  const hasCompare = !!(compareProducts && onToggleCompare)
  const totalCols = (hasSelection ? 1 : 0) + (hasCompare ? 1 : 0) + 9 // my? + compare? + hide + bookmark + expand + 6 data columns

  return (
    <div className="glass-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <caption className="sr-only">
            Software products with PQC support, FIPS validation status, and migration details.
            Expandable rows show capabilities and certifications.
          </caption>
          <thead>
            <tr className="border-b border-border bg-muted/20">
              {hasCompare && (
                <th
                  scope="col"
                  className="p-2 w-8 text-center text-xs text-muted-foreground font-medium"
                  title="Compare up to 3 products side-by-side"
                >
                  <span className="sr-only">Compare</span>⚖
                </th>
              )}
              {hasSelection && (
                <th
                  scope="col"
                  className="p-2 w-8 text-center text-xs text-muted-foreground font-medium"
                  title="Mark products as yours for filtered views"
                >
                  My
                </th>
              )}
              <th scope="col" className="p-4 w-8" title="Hide product from view">
                <span className="sr-only">Hide</span>
              </th>
              <th scope="col" className="p-4 w-8" title="Bookmark for quick access">
                <span className="sr-only">Bookmark</span>
              </th>
              <th scope="col" className="p-4 w-10">
                <span className="sr-only">Expand</span>
              </th>
              {headers.map((header) => (
                <th
                  key={header.key}
                  scope="col"
                  className={`p-4 font-semibold text-sm cursor-pointer hover:text-primary transition-colors${header.mobileHidden ? ' hidden md:table-cell' : ''}`}
                  onClick={() => handleSort(header.key)}
                  aria-sort={
                    sortConfig.key === header.key
                      ? sortConfig.direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  <div className="flex items-center gap-1">
                    {header.label}
                    {sortConfig.key === header.key ? (
                      sortConfig.direction === 'asc' ? (
                        <ArrowUp size={14} />
                      ) : (
                        <ArrowDown size={14} />
                      )
                    ) : (
                      <ArrowUpDown size={14} className="text-muted-foreground/50" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleData.map((item) => {
              const key = rowKey(item)
              const isExpanded = expandedIds.has(key)
              return (
                <React.Fragment key={key}>
                  <tr
                    className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => toggleExpand(key)}
                  >
                    {hasCompare && (
                      <td className="p-2 w-8 text-center">
                        <button
                          type="button"
                          aria-label={
                            compareProducts!.has(key)
                              ? 'Remove from comparison'
                              : 'Add to comparison'
                          }
                          title={
                            maxCompareReached && !compareProducts!.has(key)
                              ? 'Max 3 reached'
                              : compareProducts!.has(key)
                                ? 'Remove from comparison'
                                : 'Add to comparison'
                          }
                          disabled={maxCompareReached && !compareProducts!.has(key)}
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleCompare!(key)
                          }}
                          className={`p-1 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                            compareProducts!.has(key)
                              ? 'text-secondary hover:text-secondary/80'
                              : 'text-muted-foreground/40 hover:text-secondary'
                          }`}
                        >
                          {compareProducts!.has(key) ? (
                            <CheckSquare size={16} />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>
                    )}
                    {hasSelection && (
                      <td className="p-2 w-8 text-center">
                        <button
                          type="button"
                          aria-label={
                            selectedProducts.has(key)
                              ? 'Remove from My Products'
                              : 'Add to My Products'
                          }
                          title={
                            selectedProducts.has(key)
                              ? 'Remove from My Products'
                              : 'Add to My Products'
                          }
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleProduct(key)
                          }}
                          className={`p-1 rounded transition-colors ${
                            selectedProducts.has(key)
                              ? 'text-primary hover:text-primary/80'
                              : 'text-muted-foreground/40 hover:text-primary'
                          }`}
                        >
                          {selectedProducts.has(key) ? (
                            <CheckSquare size={16} />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>
                    )}
                    <td className="p-2 w-8">
                      {onHideProduct && (
                        <button
                          type="button"
                          aria-label="Hide this product"
                          title="Hide this product"
                          onClick={(e) => {
                            e.stopPropagation()
                            onHideProduct(key)
                          }}
                          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <EyeOff size={14} />
                        </button>
                      )}
                    </td>
                    <td className="p-2 w-8">
                      <button
                        type="button"
                        aria-label={
                          migrateBookmarkSet.has(item.softwareName)
                            ? `Remove ${item.softwareName} bookmark`
                            : `Bookmark ${item.softwareName}`
                        }
                        title={
                          migrateBookmarkSet.has(item.softwareName)
                            ? 'Remove bookmark'
                            : 'Bookmark for quick access'
                        }
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleMigrateBookmark(item.softwareName)
                        }}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded transition-colors"
                      >
                        {migrateBookmarkSet.has(item.softwareName) ? (
                          <BookmarkCheck size={14} className="text-primary" />
                        ) : (
                          <Bookmark
                            size={14}
                            className="text-muted-foreground/40 hover:text-primary"
                          />
                        )}
                      </button>
                    </td>
                    <td className="p-4">
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${item.softwareName}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleExpand(key)
                        }}
                        className="p-1 rounded text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {isExpanded ? (
                          <ChevronDown size={16} aria-hidden="true" />
                        ) : (
                          <ChevronRight size={16} aria-hidden="true" />
                        )}
                      </button>
                    </td>
                    <td className="p-4 font-medium text-foreground">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const layerIds = item.infrastructureLayer.split(',').map((l) => l.trim())
                          const layer = LAYERS.find((l) => layerIds.includes(l.id))
                          if (!layer) return null
                          const Icon = layer.icon
                          return (
                            <div
                              className={`p-1.5 rounded-md bg-muted/20 border ${layer.borderColor} ${layer.iconColor}`}
                              aria-label={layerIds
                                .map((id) => LAYERS.find((l) => l.id === id)?.label ?? id)
                                .join(', ')}
                            >
                              <Icon size={16} aria-hidden="true" />
                            </div>
                          )
                        })()}
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span>{item.softwareName}</span>
                            {item.status && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${
                                  item.status === 'New'
                                    ? 'bg-primary/10 text-primary border-primary/20'
                                    : 'bg-status-warning/10 text-status-warning border-status-warning/20'
                                }`}
                              >
                                {item.status}
                              </span>
                            )}
                            {getProductExtraction(item.softwareName) && (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20"
                                title="AI-analyzed product with enriched extraction data"
                              >
                                <Sparkles size={10} aria-hidden="true" />
                                Enriched
                              </span>
                            )}
                            <TrustScoreBadge
                              resourceType="migrate"
                              resourceId={item.softwareName}
                              size="sm"
                            />
                            <CertBadges certs={certsByProduct.get(item.softwareName) || []} />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {item.latestVersion}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {item.infrastructureLayer
                        .split(',')
                        .map((id) => id.trim())
                        .map((id) => LAYERS.find((l) => l.id === id)?.label ?? id)
                        .join(', ')}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">
                      {item.categoryName}
                    </td>
                    <td className="p-4 text-sm">{renderPqcSupport(item.pqcSupport)}</td>
                    <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">
                      {item.license}
                    </td>
                    <td className="p-4 text-sm">{renderFipsStatus(item.fipsValidated)}</td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-muted/10 border-b border-border">
                      <td colSpan={totalCols} className="p-0">
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm animate-fade-in">
                          <div>
                            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                              <Info size={14} /> Description
                            </h4>
                            <p className="text-muted-foreground mb-4">
                              {item.pqcCapabilityDescription}
                            </p>

                            <EvidenceWarnings flags={item.evidenceFlags} />

                            <h4 className="font-semibold text-foreground mb-2 mt-4">
                              Capability Details
                            </h4>
                            <div className="space-y-2">
                              <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-2">
                                <span className="text-muted-foreground">Platforms:</span>
                                <span className="text-foreground">{item.primaryPlatforms}</span>
                              </div>
                              <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-2">
                                <span className="text-muted-foreground">Industries:</span>
                                <span className="text-foreground">{item.targetIndustries}</span>
                              </div>
                              <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-2">
                                <span className="text-muted-foreground">Migration Priority:</span>
                                <span
                                  className={`font-medium ${
                                    item.pqcMigrationPriority === 'Critical'
                                      ? 'text-status-error'
                                      : item.pqcMigrationPriority === 'High'
                                        ? 'text-status-warning'
                                        : item.pqcMigrationPriority === 'Medium'
                                          ? 'text-primary'
                                          : 'text-muted-foreground'
                                  }`}
                                >
                                  {item.pqcMigrationPriority}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold text-foreground mb-2">Metadata</h4>
                              <div className="space-y-1 text-muted-foreground">
                                <p>
                                  Released:{' '}
                                  <span className="text-foreground">{item.releaseDate}</span>
                                </p>
                                <p className="flex items-center gap-2 flex-wrap">
                                  <span>
                                    Last Verified:{' '}
                                    <span className="text-foreground">{item.lastVerifiedDate}</span>
                                  </span>
                                  <ValidationResultBadge result={item.validationResult} />
                                </p>
                                <p>Source Type: {item.sourceType}</p>
                                {item.vendorId && vendorMap.has(item.vendorId) && (
                                  <p>
                                    Vendor:{' '}
                                    <a
                                      href={vendorMap.get(item.vendorId)!.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-foreground hover:text-primary transition-colors"
                                    >
                                      {vendorMap.get(item.vendorId)!.vendorDisplayName}
                                    </a>
                                  </p>
                                )}
                              </div>
                            </div>

                            {(() => {
                              const certs = certsByProduct.get(item.softwareName)
                              if (!certs || certs.length === 0) return null
                              return (
                                <div>
                                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                    <Award size={14} /> PQC Certifications
                                  </h4>
                                  <div className="space-y-2">
                                    {certs.map((cert) => {
                                      const badgeClass =
                                        cert.certType === 'FIPS 140-3'
                                          ? 'bg-status-success text-status-success'
                                          : cert.certType === 'ACVP'
                                            ? 'bg-primary/10 text-primary border-primary/20'
                                            : 'bg-status-warning text-status-warning'
                                      const levelShort =
                                        cert.certificationLevel
                                          ?.split(',')[0]
                                          ?.replace('FIPS 140-3 ', '')
                                          ?.trim() || ''
                                      return (
                                        <a
                                          key={cert.certId}
                                          href={cert.certLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 text-xs group hover:bg-muted/30 rounded-md p-1.5 -mx-1.5 transition-colors"
                                        >
                                          <span
                                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap ${badgeClass}`}
                                          >
                                            {cert.certType === 'Common Criteria'
                                              ? 'CC'
                                              : cert.certType}
                                          </span>
                                          <span className="text-muted-foreground truncate">
                                            {cert.certProduct.length > 40
                                              ? cert.certProduct.slice(0, 40) + '...'
                                              : cert.certProduct}
                                          </span>
                                          {cert.pqcAlgorithms &&
                                            !cert.pqcAlgorithms.startsWith('Potentially') && (
                                              <span className="text-foreground font-medium whitespace-nowrap">
                                                {cert.pqcAlgorithms}
                                              </span>
                                            )}
                                          {levelShort && (
                                            <span className="text-muted-foreground whitespace-nowrap">
                                              {levelShort}
                                            </span>
                                          )}
                                          <ExternalLink
                                            size={10}
                                            className="text-muted-foreground/50 group-hover:text-primary shrink-0"
                                          />
                                        </a>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })()}

                            {(() => {
                              const cpe = cpeByProduct.get(item.softwareName)
                              const purl = purlByProduct.get(item.softwareName)
                              const vendor = item.vendorId
                                ? vendorMap.get(item.vendorId)
                                : undefined
                              const hasCpe = cpe && cpe.status !== 'not_found'
                              const hasPurl = purl && purl.status !== 'not_found'
                              const hasLei = vendor?.leiCode
                              if (!hasCpe && !hasPurl && !hasLei) return null
                              return (
                                <div>
                                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                    <Shield size={14} /> External References
                                  </h4>
                                  <div className="space-y-1.5">
                                    {hasCpe && (
                                      <a
                                        href={cpe.nvdUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-xs group hover:bg-muted/30 rounded-md p-1.5 -mx-1.5 transition-colors"
                                      >
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border bg-muted/50 text-muted-foreground border-border whitespace-nowrap">
                                          CPE
                                        </span>
                                        <span className="text-muted-foreground font-mono truncate">
                                          {cpe.cpeVendor}/{cpe.cpeProduct}
                                        </span>
                                        <ExternalLink
                                          size={10}
                                          className="text-muted-foreground/50 group-hover:text-primary shrink-0"
                                        />
                                      </a>
                                    )}
                                    {hasPurl && (
                                      <a
                                        href={purl.registryUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-xs group hover:bg-muted/30 rounded-md p-1.5 -mx-1.5 transition-colors"
                                      >
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border bg-primary/10 text-primary border-primary/20 whitespace-nowrap">
                                          {purl.purlType.toUpperCase()}
                                        </span>
                                        <span className="text-muted-foreground font-mono truncate">
                                          {purl.purlName}
                                        </span>
                                        <ExternalLink
                                          size={10}
                                          className="text-muted-foreground/50 group-hover:text-primary shrink-0"
                                        />
                                      </a>
                                    )}
                                    {hasLei && vendor?.gleifUrl && (
                                      <a
                                        href={vendor.gleifUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-xs group hover:bg-muted/30 rounded-md p-1.5 -mx-1.5 transition-colors"
                                      >
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border bg-secondary/10 text-secondary border-secondary/20 whitespace-nowrap">
                                          LEI
                                        </span>
                                        <span className="text-muted-foreground font-mono truncate">
                                          {vendor.hqCountry && (
                                            <>{vendor.hqCountry.slice(0, 2).toUpperCase()} · </>
                                          )}
                                          {vendor.leiCode!.slice(0, 8)}…
                                        </span>
                                        <ExternalLink
                                          size={10}
                                          className="text-muted-foreground/50 group-hover:text-primary shrink-0"
                                        />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              )
                            })()}

                            <div className="pt-2 flex flex-col gap-2">
                              {item.repositoryUrl && (
                                <a
                                  href={item.repositoryUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                                >
                                  <ExternalLink size={14} /> Repository / Download
                                </a>
                              )}
                              {item.authoritativeSource && (
                                <a
                                  href={item.authoritativeSource}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-xs"
                                >
                                  <ExternalLink size={12} /> Authoritative Source
                                </a>
                              )}
                              {item.proofUrl && (
                                <button
                                  onClick={() => setProofModal(item)}
                                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-xs"
                                >
                                  <ShieldCheck size={12} /> View Proof
                                  {item.proofPublicationDate && (
                                    <span className="text-muted-foreground">
                                      ({item.proofPublicationDate})
                                    </span>
                                  )}
                                </button>
                              )}
                              <UpdateProductButton
                                updateUrl={buildProductUpdateUrl({
                                  productName: item.softwareName,
                                  categoryName: item.categoryName,
                                  currentPqcSupport: item.pqcSupport || 'Unknown',
                                  productDetails: [
                                    `**Version:** ${item.latestVersion || 'N/A'}`,
                                    `**FIPS:** ${item.fipsValidated || 'N/A'}`,
                                    `**Migration Priority:** ${item.pqcMigrationPriority || 'N/A'}`,
                                    item.pqcCapabilityDescription
                                      ? `**Current Capabilities:** ${item.pqcCapabilityDescription}`
                                      : '',
                                  ]
                                    .filter(Boolean)
                                    .join('\n'),
                                  pageUrl: `/migrate?q=${encodeURIComponent(item.softwareName)}`,
                                })}
                                resourceLabel={item.softwareName}
                                variant="text"
                              />
                              <AskAssistantButton
                                variant="text"
                                label="Ask about PQC capabilities"
                                question={`What PQC algorithms does ${item.softwareName} support${item.categoryName ? ` (${item.categoryName})` : ''}?${item.pqcCapabilityDescription ? ` Capabilities: ${item.pqcCapabilityDescription}` : ''}${item.fipsValidated && item.fipsValidated !== 'No' ? ` FIPS status: ${item.fipsValidated}.` : ''}`}
                              />
                              {getProductExtraction(item.softwareName) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setExtractionModal({ softwareName: item.softwareName })
                                  }}
                                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                                >
                                  <Sparkles size={14} /> View Extraction
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          aria-label={`Collapse ${item.softwareName}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleExpand(key)
                          }}
                          className="mt-3 w-full py-2 text-xs text-muted-foreground hover:text-foreground border border-border/40 rounded-lg hover:bg-background/50 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <ChevronUp size={14} />
                          Collapse
                        </button>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      <ProductExtractionModal
        isOpen={!!extractionModal}
        onClose={() => setExtractionModal(null)}
        extraction={
          extractionModal ? (getProductExtraction(extractionModal.softwareName) ?? null) : null
        }
        softwareName={extractionModal?.softwareName ?? ''}
      />
      {proofModal && (
        <ProofModal isOpen={!!proofModal} onClose={() => setProofModal(null)} item={proofModal} />
      )}
    </div>
  )
}
